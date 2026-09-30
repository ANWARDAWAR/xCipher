"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAssignRole, canManageUser, hasRequiredRole } from "@/lib/permissions";
import { randomHex } from "@/lib/utils";
import { sendInvitationEmail } from "@/lib/email";
import { createNotification } from "./notifications";
import { hashPassword } from "@/lib/crypto";
import { eq, inArray, or, and, isNull } from "drizzle-orm";
import { user as userTable, invitation as invitationTable, auditLog, author as authorTable } from "@/lib/db/schema";
import { Role } from "@/lib/types";

async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const user = await getCurrentUser();
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: user?.id || null,
      action,
      entityType,
      entityId,
      details,
    });
  } catch (e) {
    console.error("Failed to log audit event:", e);
  }
}

export async function inviteUser(formData: FormData) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return { success: false, error: "Unauthenticated" };
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;
    if (!email || !role) {
      return { success: false, error: "Email and role are required." };
    }

    const assignPolicy = canAssignRole(admin.role as Role, role as Role);
    if (!assignPolicy.success) return assignPolicy;

    // Check if user exists
    const [existingUser] = await db.select().from(userTable).where(eq(userTable.email, email)).limit(1);
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    // Generate secure token
    const token = randomHex(32);
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create or update pending invitation
    const [invitation] = await db.insert(invitationTable).values({
      id: crypto.randomUUID(),
      email,
      token,
      expires,
      role: role as Role,
      status: "PENDING",
      invitedBy: admin.id,
    }).onConflictDoUpdate({
      target: invitationTable.email,
      set: {
        token,
        expires,
        role: role as Role,
        status: "PENDING",
        invitedBy: admin.id,
      }
    }).returning();

    let baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }
    const inviteUrl = `${baseUrl}/invite/${token}`;

    const emailResult = await sendInvitationEmail({ to: email, role, inviteUrl });
    
    await logAudit("INVITE_USER", "Invitation", invitation.id, { email, role });

    if (!emailResult.success) {
      return { success: true, inviteUrl, warning: "Failed to send email. " + emailResult.error };
    }

    return { success: true, inviteUrl };
  } catch (error: any) {
    console.error("Invite error:", error);
    return { success: false, error: error.message || "An error occurred." };
  }
}

export async function revokeInvitation(id: string) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return { success: false, error: "Unauthenticated" };
    
    const [invitationToRevoke] = await db.select().from(invitationTable).where(eq(invitationTable.id, id)).limit(1);
    if (!invitationToRevoke) return { success: false, error: "Invitation not found" };

    const managePolicy = canManageUser(admin.role as Role, invitationToRevoke.role as Role);
    if (!managePolicy.success) return managePolicy;

    const [invitation] = await db.update(invitationTable).set({ status: "REVOKED" }).where(eq(invitationTable.id, id)).returning();

    await logAudit("REVOKE_INVITATION", "Invitation", id, { email: invitation.email });
    return { success: true };
  } catch (error: any) {
    console.error("Revoke error:", error);
    return { success: false, error: "Failed to revoke invitation." };
  }
}

export async function acceptInvitation(token: string, formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!name || !password || password.length < 8) {
      return { success: false, error: "Valid name and password (min 8 chars) required." };
    }

    const [invitation] = await db.select().from(invitationTable).where(eq(invitationTable.token, token)).limit(1);
    if (!invitation || invitation.status !== "PENDING" || invitation.expires < new Date()) {
      return { success: false, error: "Invalid or expired invitation." };
    }

    const hashedPassword = await hashPassword(password);

    let [existingAuthor] = await db.select().from(authorTable).where(eq(authorTable.email, invitation.email)).limit(1);

    if (!existingAuthor) {
      const [authorByName] = await db.select()
        .from(authorTable)
        .leftJoin(userTable, eq(authorTable.id, userTable.authorId))
        .where(and(eq(authorTable.name, name), isNull(userTable.id)))
        .limit(1);
        
      if (authorByName) {
         existingAuthor = authorByName.Author;
      }
    }

    let authorId = existingAuthor?.id;

    if (!authorId) {
      const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `user-${randomHex(3)}`;
      let slug = baseSlug;
      let counter = 1;
      while ((await db.select().from(authorTable).where(eq(authorTable.slug, slug)).limit(1)).length > 0) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      const [newAuthor] = await db.insert(authorTable).values({
        id: crypto.randomUUID(),
        slug,
        name,
        email: invitation.email,
        role: invitation.role,
      }).returning();
      authorId = newAuthor.id;
    }

    const [user] = await db.insert(userTable).values({
      id: crypto.randomUUID(),
      email: invitation.email,
      name,
      password: hashedPassword,
      role: invitation.role,
      authorId
    }).returning();

    await db.update(invitationTable).set({ status: "ACCEPTED" }).where(eq(invitationTable.id, invitation.id));

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: user.id,
      action: "ACCEPT_INVITATION",
      entityType: "User",
      entityId: user.id,
      details: { role: user.role }
    });

    const admins = await db.select({ id: userTable.id }).from(userTable).where(inArray(userTable.role, ["ADMIN", "OWNER"]));

    for (const admin of admins) {
      await createNotification(
        admin.id,
        `${name} (${invitation.email}) has joined as ${invitation.role}.`,
        "INVITE_ACCEPTED",
        "/admin/users"
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Accept invite error:", error);
    return { success: false, error: "Failed to accept invitation." };
  }
}
