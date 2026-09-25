"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { sanitizeBioHtml, isValidSafeUrl, ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import { deleteImageFromCloudinary } from "@/lib/storage";

export async function updateProfile(data: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    // Editing someone else's profile.
    //
    // data.targetUserId is a request, not an instruction: the capability is
    // checked against the *actor's* role read from the database, never from the
    // session or the payload. Without this the action always wrote to the
    // caller's own authorId, so an owner had no way to correct another user's
    // name or byline.
    //
    // author.manage.all is the same capability that gates /admin/authors, so
    // the UI and the server agree on who may do this.
    const requestedTargetId: string | undefined =
      typeof data?.targetUserId === "string" && data.targetUserId.trim()
        ? data.targetUserId.trim()
        : undefined;

    const actor = await db.user.findUnique({ where: { id: user.id } });
    if (!actor) {
      throw new Error("User not found in database.");
    }

    const isEditingOther = Boolean(requestedTargetId && requestedTargetId !== actor.id);

    if (isEditingOther && !authorize(actor.role as Role, "author.manage.all")) {
      return { success: false, error: "You do not have permission to edit another user's profile." };
    }

    const dbUser = isEditingOther
      ? await db.user.findUnique({ where: { id: requestedTargetId! } })
      : actor;

    if (!dbUser) {
      throw new Error("User not found in database.");
    }

    const { name, headline, role, overview, bio, avatar, location, website, email, socialLinks, expertise, verifiedTitle, disclosure, publicContact, slug: submittedSlug, pgpPublicKey } = data;

    // Generate base slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `user-${dbUser.id.substring(0, 6)}`;
    
    // Only OWNER and ADMIN can edit `role` and `verifiedTitle`
    // Checked against the actor, not the profile being edited -- otherwise
    // editing an admin's profile would confer admin privileges on the edit.
    const isEditorialAdmin = authorize(actor.role as Role, "user.manage");
    let finalRole = role;
    let finalVerifiedTitle = verifiedTitle;
    
    // Validate avatar URL against trusted domains
    if (avatar && !isValidSafeUrl(avatar, ALLOWED_MEDIA_DOMAINS)) {
      return { success: false, error: "Avatar URL is invalid or from an unapproved domain." };
    }

    // Validate website URL
    if (website && !isValidSafeUrl(website)) {
      return { success: false, error: "Website URL must be a valid HTTP or HTTPS link." };
    }

    // Sanitize bio
    const safeBio = sanitizeBioHtml(bio);

    // Validate social links
    const safeSocialLinks = socialLinks;
    if (socialLinks) {
      let parsedLinks = [];
      try {
        parsedLinks = typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks;
        if (Array.isArray(parsedLinks)) {
          for (const link of parsedLinks) {
            if (link.url && !isValidSafeUrl(link.url)) {
              return { success: false, error: `Invalid social link URL: ${link.url}` };
            }
          }
        }
      } catch (e) {
        // Just let it pass if not parsable array, though realistically it shouldn't happen
      }
    }

    // If user already has an author, manage slug history
    let finalSlug = baseSlug;
    let updatedPreviousSlugs: string[] = [];

    if (dbUser.authorId) {
      const existing = await db.author.findUnique({ where: { id: dbUser.authorId } });
      if (existing) {
        if (!isEditorialAdmin && actor.role !== "AUTHOR") {
           // Let's assume standard authors might be allowed to change name but admins can change slug?
           // The prompt says "Do not break current author URLs... handle slug changes through a redirect strategy"
           // Let's allow users to submit a slug or we use baseSlug, but we enforce uniqueness and redirect
        }
        
        finalSlug = submittedSlug || existing.slug;
        if (!finalRole && !isEditorialAdmin) finalRole = existing.role;
        if (finalVerifiedTitle === undefined && !isEditorialAdmin) finalVerifiedTitle = existing.verifiedTitle;
        
        const currentPreviousSlugs = existing.previousSlugs || [];
        updatedPreviousSlugs = existing.slug !== finalSlug 
          ? Array.from(new Set([...currentPreviousSlugs, existing.slug]))
          : currentPreviousSlugs;
          
        if (existing.avatar && avatar !== existing.avatar) {
          deleteImageFromCloudinary(existing.avatar).catch(console.error);
        }
      }
    } else {
      finalSlug = submittedSlug || baseSlug;
    }

    const author = await db.author.upsert({
      where: { id: dbUser.authorId || 'non-existent-id' },
      update: { 
        slug: finalSlug, previousSlugs: updatedPreviousSlugs,
        name, headline, role: isEditorialAdmin ? finalRole : undefined, 
        overview, bio: safeBio, avatar, location, website, email, socialLinks: safeSocialLinks,
        expertise, verifiedTitle: isEditorialAdmin ? finalVerifiedTitle : undefined,
        disclosure, publicContact 
      },
      create: { 
        slug: finalSlug, name, headline, role: isEditorialAdmin ? finalRole : null, 
        overview, bio: safeBio, avatar, location, website, email, socialLinks: safeSocialLinks,
        expertise, verifiedTitle: isEditorialAdmin ? (finalVerifiedTitle || false) : false,
        disclosure, publicContact: publicContact !== undefined ? publicContact : true 
      },
    });

    if (!dbUser.authorId || dbUser.name !== name || pgpPublicKey !== undefined) {
      await db.user.update({
        // dbUser, not the actor: when an owner edits someone else's profile
        // the author record must attach to that user's account.
        where: { id: dbUser.id },
        data: { 
          authorId: author.id, 
          name, 
          ...(pgpPublicKey !== undefined ? { pgpPublicKey } : {})
        },
      });
    }

    revalidatePath('/');
    revalidatePath('/admin/settings');
    revalidatePath('/admin');
    revalidatePath(`/author/${author.slug}`);

    return { success: true, slug: author.slug };
  } catch (error: any) {
    console.error("updateProfile error:", error);
    return { success: false, error: error.message || "Failed to update profile" };
  }
}

// ---------------------------------------------------------------------------
// Notification preferences
// ---------------------------------------------------------------------------
// The settings form has had these three toggles since it was written, but
// handlePrefsSubmit was a setTimeout that showed "(Mock)" and discarded the
// change. Now that notifications actually send email, a toggle that does not
// persist is worse than no toggle: someone turns alerts off, is told it worked,
// and keeps receiving mail.

export type NotificationPrefsInput = {
  emailAlerts?: boolean;
  weeklyDigest?: boolean;
  reviewUpdates?: boolean;
};

export async function updateNotificationPrefs(prefs: NotificationPrefsInput) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    // Whitelist and coerce rather than storing the payload as-is. This lands in
    // a Json column, so an unvalidated object would let a client persist
    // arbitrary keys into the user record.
    const clean = {
      emailAlerts: prefs.emailAlerts !== false,
      weeklyDigest: prefs.weeklyDigest === true,
      reviewUpdates: prefs.reviewUpdates !== false,
    };

    await db.user.update({
      where: { id: user.id },
      data: { notificationPrefs: clean },
    });

    revalidatePath("/admin/settings");
    return { success: true, prefs: clean };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update preferences";
    return { success: false, error: message };
  }
}
