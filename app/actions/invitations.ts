"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canAssignRole, canManageUser, hasRequiredRole } from "@/lib/permissions";
import crypto from "crypto";
import { sendInvitationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";

// Staff accounts are created here, not self-registered, so the password floor
// is real policy rather than a hint: 10+ characters with letters and digits.
const acceptSchema = z.object({
  name: z.string().trim().min(1, "Your name is required.").max(80),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters.")
    .max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter.")
    .regex(/[0-9]/, "Password must contain at least one digit."),
});

async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const user = await getCurrentUser();
    await db.auditLog.create({
      data: {
        userId: user?.id || null,
        action,
        entityType,
        entityId,
        details,
      }
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
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return { success: false, error: "A user with this email already exists." };
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create or update pending invitation
    const invitation = await db.invitation.upsert({
      where: { email },
      update: {
        token,
        expires,
        role: role as Role,
        status: "PENDING",
        invitedBy: admin.id,
      },
      create: {
        email,
        token,
        expires,
        role: role as Role,
        status: "PENDING",
        invitedBy: admin.id,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const inviteUrl = `${siteUrl}/invite/${token}`;

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
    
    const invitationToRevoke = await db.invitation.findUnique({ where: { id } });
    if (!invitationToRevoke) return { success: false, error: "Invitation not found" };

    const managePolicy = canManageUser(admin.role as Role, invitationToRevoke.role as Role);
    if (!managePolicy.success) return managePolicy;

    const invitation = await db.invitation.update({
      where: { id },
      data: { status: "REVOKED" },
    });

    await logAudit("REVOKE_INVITATION", "Invitation", id, { email: invitation.email });
    return { success: true };
  } catch (error: any) {
    console.error("Revoke error:", error);
    return { success: false, error: "Failed to revoke invitation." };
  }
}

export async function acceptInvitation(token: string, formData: FormData) {
  try {
    const parsed = acceptSchema.safeParse({
      name: formData.get("name"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }
    const { name, password } = parsed.data;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Claim-before-create, in one transaction. The old flow read the
    // invitation, then created the user, then marked it accepted: two
    // concurrent accepts both observed PENDING, and a crash between the two
    // writes left an accepted account attached to a re-usable token. Now the
    // token is consumed atomically -- a second accept races to count 0 and
    // the user row is either committed with it or not at all.
    const user = await db.$transaction(async (tx) => {
      const claim = await tx.invitation.updateMany({
        where: { token, status: "PENDING", expires: { gt: new Date() } },
        data: { status: "ACCEPTED" },
      });
      if (claim.count === 0) {
        throw new Error("INVITATION_UNAVAILABLE");
      }

      const invitation = await tx.invitation.findUnique({ where: { token } });
      if (!invitation) {
        throw new Error("INVITATION_UNAVAILABLE");
      }

      return tx.user.create({
        data: {
          email: invitation.email,
          name,
          password: hashedPassword,
          role: invitation.role,
        }
      });
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: "ACCEPT_INVITATION",
        entityType: "User",
        entityId: user.id,
        details: { role: user.role }
      }
    });

    return { success: true };
  } catch (error: any) {
    if (error instanceof Error && error.message === "INVITATION_UNAVAILABLE") {
      return { success: false, error: "Invalid or expired invitation." };
    }
    // Prisma unique-violation on User.email: an account with this address
    // already exists (e.g. an earlier accept that crashed after create).
    if (error?.code === "P2002") {
      return { success: false, error: "An account with this email already exists. Sign in instead." };
    }
    console.error("Accept invite error:", error);
    return { success: false, error: "Failed to accept invitation." };
  }
}
