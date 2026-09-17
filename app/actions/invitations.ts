"use server";

import { db } from "@/lib/db";
import { getCurrentUser, requireRole } from "@/lib/auth";
import crypto from "crypto";
import { sendInvitationEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

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
    const admin = await requireRole(["OWNER", "ADMIN"]);
    
    const email = formData.get("email") as string;
    const role = formData.get("role") as string;

    if (!email || !role) {
      return { success: false, error: "Email and role are required." };
    }

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
    await requireRole(["OWNER", "ADMIN"]);
    
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
    const name = formData.get("name") as string;
    const password = formData.get("password") as string;

    if (!name || !password || password.length < 8) {
      return { success: false, error: "Valid name and password (min 8 chars) required." };
    }

    const invitation = await db.invitation.findUnique({ where: { token } });
    if (!invitation || invitation.status !== "PENDING" || invitation.expires < new Date()) {
      return { success: false, error: "Invalid or expired invitation." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email: invitation.email,
        name,
        password: hashedPassword,
        role: invitation.role,
      }
    });

    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED" },
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
    console.error("Accept invite error:", error);
    return { success: false, error: "Failed to accept invitation." };
  }
}
