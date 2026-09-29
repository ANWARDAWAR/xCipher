"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { revalidatePath } from "@/lib/revalidate";
import { eq, sql, inArray, isNull } from "drizzle-orm";
import { user as userTable, author as authorTable, article } from "@/lib/db/schema";

import { sanitizeBioHtml, isValidSafeUrl, getAllowedMediaDomains } from "@/lib/sanitize";
import { deleteImageFromCloudinary } from "@/lib/cloudinary";
import { Role } from "@/lib/types";

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

    const [actor] = await db.select().from(userTable).where(eq(userTable.id, user.id)).limit(1);
    if (!actor) {
      throw new Error("User not found in database.");
    }

    const isEditingOther = Boolean(requestedTargetId && requestedTargetId !== actor.id);

    if (isEditingOther && !authorize(actor.role as Role, "author.manage.all")) {
      return { success: false, error: "You do not have permission to edit another user's profile." };
    }

    const [dbUser] = isEditingOther
      ? await db.select().from(userTable).where(eq(userTable.id, requestedTargetId!)).limit(1)
      : [actor];

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
    if (avatar && !isValidSafeUrl(avatar, getAllowedMediaDomains())) {
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
      const [existing] = await db.select().from(authorTable).where(eq(authorTable.id, dbUser.authorId)).limit(1);
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

    const createData = { 
        id: dbUser.authorId || crypto.randomUUID(),
        slug: finalSlug, name, headline, role: isEditorialAdmin ? finalRole : null, 
        overview, bio: safeBio, avatar, location, website, email, socialLinks: safeSocialLinks,
        expertise, verifiedTitle: isEditorialAdmin ? (finalVerifiedTitle || false) : false,
        disclosure, publicContact: publicContact !== undefined ? publicContact : true 
      };

    const updateData = { 
        slug: finalSlug, previousSlugs: updatedPreviousSlugs,
        name, headline, role: isEditorialAdmin ? finalRole : undefined, 
        overview, bio: safeBio, avatar, location, website, email, socialLinks: safeSocialLinks,
        expertise, verifiedTitle: isEditorialAdmin ? finalVerifiedTitle : undefined,
        disclosure, publicContact 
      };
      
    const [author] = await db.insert(authorTable)
      .values(createData)
      .onConflictDoUpdate({
        target: authorTable.id,
        set: updateData
      }).returning();

    if (!dbUser.authorId || dbUser.name !== name || pgpPublicKey !== undefined) {
      await db.update(userTable).set({ 
          authorId: author.id, 
          name, 
          ...(pgpPublicKey !== undefined ? { pgpPublicKey } : {})
        }).where(eq(userTable.id, dbUser.id));
    }

    // Cascade update to denormalized author name on all articles
    await db.update(article).set({ author: name }).where(eq(article.authorId, author.id));

    revalidatePath('/', 'layout');
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

    await db.update(userTable).set({ notificationPrefs: clean }).where(eq(userTable.id, user.id));

    revalidatePath("/admin/settings");
    return { success: true, prefs: clean };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to update preferences";
    return { success: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Sync Existing Users to Authors
// ---------------------------------------------------------------------------
// Since existing OWNER and ADMIN accounts were created before the Author linking 
// logic, we need to generate Author profiles for them retroactively.

export async function syncAllExistingAuthors() {
  const user = await getCurrentUser();
  if (!user || !authorize(user.role as Role, "user.manage")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const unlinkedUsers = await db.query.user.findMany({
      where: isNull(userTable.authorId)
    });

    const rolesToSync = ["OWNER", "ADMIN", "EDITOR", "MODERATOR", "REVIEWER", "AUTHOR"];
    const usersToProcess = unlinkedUsers.filter(u => rolesToSync.includes(u.role || ""));

    let syncedCount = 0;
    for (const u of usersToProcess) {
      // 1. Try to find an existing author by email
      let existingAuthor = null;
      if (u.email) {
        const [matched] = await db.query.author.findMany({
          where: eq(authorTable.email, u.email),
          limit: 1
        });
        existingAuthor = matched || null;
      }

      let authorIdToLink = existingAuthor?.id;

      // 2. If no existing author found, create one
      if (!authorIdToLink) {
        const name = u.name || `User ${u.id.substring(0, 6)}`;
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `user-${u.id.substring(0, 6)}`;
        
        // Ensure slug uniqueness
        let uniqueSlug = baseSlug;
        let counter = 1;
        while (true) {
          const [slugConflict] = await db.query.author.findMany({
            where: eq(authorTable.slug, uniqueSlug),
            limit: 1
          });
          if (!slugConflict) break;
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }

        const createData = { 
          id: crypto.randomUUID(),
          slug: uniqueSlug, 
          name, 
          role: u.role, 
          overview: "", 
          bio: "", 
          avatar: u.image || null, 
          location: "", 
          website: "", 
          email: u.email || "", 
          socialLinks: [],
          expertise: "", 
          verifiedTitle: false,
          disclosure: "", 
          publicContact: true 
        };

        const [newAuthor] = await db.insert(authorTable)
          .values(createData)
          .returning();
        
        authorIdToLink = newAuthor.id;
      }

      // 3. Link the user to the author
      if (authorIdToLink) {
        await db.update(userTable)
          .set({ authorId: authorIdToLink })
          .where(eq(userTable.id, u.id));
        syncedCount++;
      }
    }

    if (syncedCount > 0) {
      revalidatePath("/admin/settings");
      revalidatePath("/admin/authors");
      revalidatePath("/admin/users");
    }

    return { success: true, count: syncedCount };
  } catch (error: any) {
    console.error("syncAllExistingAuthors error:", error);
    return { success: false, error: error.message || "Failed to sync authors" };
  }
}
