"use server";

import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rateLimit";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomHex } from "@/lib/utils";
import { hashPassword } from "@/lib/crypto";
import { z } from "zod";
import { user, passwordResetToken as passwordResetTokenTable, auditLog } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function requestPasswordReset(email: string): Promise<{ success?: string, error?: string }> {
  try {
    const [u] = await db.select().from(user).where(eq(user.email, email)).limit(1);

    if (!u || !u.password) {
      return { error: "No account found with this email address." };
    }

    const rl = await checkRateLimit("password-reset:email", email, { limit: 3, windowMs: 30 * 60 * 1000 });
    if (rl.allowed) {
      await db.update(passwordResetTokenTable)
        .set({ used: true })
        .where(and(eq(passwordResetTokenTable.userId, u.id), eq(passwordResetTokenTable.used, false)));

      const token = randomHex(32);
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.insert(passwordResetTokenTable).values({
        id: crypto.randomUUID(),
        userId: u.id,
        email: email,
        token,
        expires,
      });

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

      await sendPasswordResetEmail({ to: email, resetUrl });

      await db.insert(auditLog).values({
        id: crypto.randomUUID(),
        action: "REQUEST_PASSWORD_RESET",
        entityType: "User",
        entityId: u.id,
      });
    }

    return { success: "A password reset link has been sent to your email." };
  } catch (e) {
    console.error("Password reset request error:", e);
    return { error: "An unexpected error occurred." };
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean, error?: string }> {
  try {
    const schema = z.string().min(8);
    const parsed = schema.safeParse(newPassword);
    if (!parsed.success) {
      return { success: false, error: "Password must be at least 8 characters." };
    }

    const [resetToken] = await db.select()
      .from(passwordResetTokenTable)
      .where(eq(passwordResetTokenTable.token, token))
      .limit(1);

    if (!resetToken || resetToken.used) {
      return { success: false, error: "Invalid or expired reset link." };
    }

    if (resetToken.expires < new Date()) {
      return { success: false, error: "This reset link has expired. Please request a new one." };
    }

    const hashedPassword = await hashPassword(newPassword);

    
            await db.update(user)
              .set({
                password: hashedPassword,
                sessionVersion: sql`${user.sessionVersion} + 1`,
              })
              .where(eq(user.id, resetToken.userId));

            await db.update(passwordResetTokenTable)
              .set({ used: true })
              .where(eq(passwordResetTokenTable.id, resetToken.id));

            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              action: "RESET_PASSWORD",
              entityType: "User",
              entityId: resetToken.userId,
            });
          

    return { success: true };
  } catch (e) {
    console.error("Password reset error:", e);
    return { success: false, error: "Failed to reset password." };
  }
}
