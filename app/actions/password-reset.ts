"use server";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";

export async function requestPasswordReset(email: string): Promise<{ success: boolean }> {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });

    if (user && user.password) {
      const rl = await checkRateLimit("password-reset:email", email, { limit: 3, windowMs: 30 * 60 * 1000 });
      if (rl.allowed) {
        await db.passwordResetToken.updateMany({
          where: { userId: user.id, used: false },
          data: { used: true },
        });

        const token = crypto.randomBytes(32).toString("hex");
        const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.passwordResetToken.create({
          data: {
            userId: user.id,
            email: user.email,
            token,
            expires,
          },
        });

        const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const resetUrl = process.env.NODE_ENV === "production" 
          ? `https://admin.xsypher.com/reset-password?token=${token}`
          : `${baseUrl}/admin/reset-password?token=${token}`;

        await sendPasswordResetEmail({ to: email, resetUrl });

        await db.auditLog.create({
          data: { action: "REQUEST_PASSWORD_RESET", entityType: "User", entityId: user.id },
        });
      }
    }
  } catch (e) {
    console.error("Password reset request error:", e);
  }

  // Always return success to prevent email enumeration
  return { success: true };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean, error?: string }> {
  try {
    const schema = z.string().min(8);
    const parsed = schema.safeParse(newPassword);
    if (!parsed.success) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken || resetToken.used) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    if (resetToken.expires < new Date()) {
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          sessionVersion: { increment: 1 },
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      });

      await tx.auditLog.create({
        data: { action: "RESET_PASSWORD", entityType: "User", entityId: resetToken.userId },
      });
    });

    return { success: true };
  } catch (e) {
    console.error("Password reset error:", e);
    return { success: false, error: "Failed to reset password." };
  }
}
