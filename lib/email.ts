import { Resend } from "resend";

// Constructed lazily. `new Resend(undefined)` throws "Missing API key" at
// construction time, so building it at module scope meant that merely importing
// this file crashed whenever RESEND_API_KEY was absent -- which is the normal
// state in local development, in CI, and for any newsroom running in-app
// notifications only.
//
// That was survivable while the only caller was the invitation flow, which is
// rare and deliberate. It stopped being survivable once lib/notifications.ts
// began importing this on every workflow transition: an unconfigured install
// would have thrown on import and taken the transition with it, exactly the
// failure the fail-soft notification contract exists to prevent.
let client: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

interface SendInvitationEmailParams {
  to: string;
  role: string;
  inviteUrl: string;
}

export async function sendInvitationEmail({ to, role, inviteUrl }: SendInvitationEmailParams) {
  const resend = getResend();
  if (!resend) {
    // Unlike a workflow notification, an invitation that silently vanishes
    // strands a person who is waiting for a link, so this one reports rather
    // than skipping quietly. The caller surfaces the error.
    console.error("[email] RESEND_API_KEY is not set; invitation not sent to", to);
    return { success: false, error: "Email delivery is not configured." };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || "xSypher <onboarding@resend.dev>",
      to,
      subject: "You have been invited to join xSypher",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">x<span style="color: #666;">Sypher</span></h1>
          <p style="font-size: 16px; color: #ccc;">Hello,</p>
          <p style="font-size: 16px; color: #ccc;">You have been invited to join the xSypher newsroom as a <strong>${role}</strong>.</p>
          <p style="font-size: 16px; color: #ccc;">Click the link below to set up your account. This link will expire in 48 hours.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteUrl}" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 14px; color: #666; border-top: 1px solid #333; padding-top: 20px;">
            If you did not expect this invitation, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send invitation email:", error);
    return { success: false, error: error.message };
  }
}

export interface SendPasswordResetEmailParams {
  to: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail({ to, resetUrl }: SendPasswordResetEmailParams) {
  const resend = getResend();
  if (!resend) {
    console.error("[email] RESEND_API_KEY is not set; password reset not sent to", to);
    return { success: false, error: "Email delivery is not configured." };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || "xSypher <onboarding@resend.dev>",
      to,
      subject: "Reset your xSypher password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">x<span style="color: #666;">Sypher</span></h1>
          <p style="font-size: 16px; color: #ccc;">Hello,</p>
          <p style="font-size: 16px; color: #ccc;">We received a request to reset the password for your xSypher account.</p>
          <p style="font-size: 16px; color: #ccc;">Click the button below to choose a new password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #666; border-top: 1px solid #333; padding-top: 20px;">
            If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

// ---------------------------------------------------------------------------
// Workflow notification email
// ---------------------------------------------------------------------------
// Sent from lib/notifications.ts alongside the in-app row, never instead of it.
// The in-app notification is the record; email is a nudge for people who are
// not currently looking at the console.

interface SendNotificationEmailParams {
  to: string;
  recipientName?: string | null;
  message: string;
  link?: string | null;
}

function escapeHtml(value: string) {
  // Article titles are interpolated into this template and are author-supplied.
  // Resend does not sanitize, so an apostrophe or angle bracket in a headline
  // would otherwise break the markup -- and a crafted title could inject into
  // the email body.
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendNotificationEmail({
  to,
  recipientName,
  message,
  link,
}: SendNotificationEmailParams) {
  // Absent configuration is a normal state, not an error. Local development and
  // CI have no Resend key, and a newsroom may deliberately run in-app only;
  // none of those should produce error noise on every transition.
  const resend = getResend();
  if (!resend) {
    return { success: false, skipped: true as const, error: "RESEND_API_KEY is not set" };
  }

  const base = process.env.NEXTAUTH_URL || "";
  const absoluteLink = link && base ? `${base}${link}` : null;
  const safeMessage = escapeHtml(message);
  const greeting = recipientName ? `Hello ${escapeHtml(recipientName)},` : "Hello,";

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM_ADDRESS || "xSypher <onboarding@resend.dev>",
      to,
      // The message already reads as a sentence about a specific article, so it
      // makes a better subject than a generic "You have a notification".
      subject: message.length > 90 ? `${message.slice(0, 87)}...` : message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">x<span style="color: #666;">Sypher</span></h1>
          <p style="font-size: 16px; color: #ccc;">${greeting}</p>
          <p style="font-size: 16px; color: #ccc;">${safeMessage}</p>
          ${
            absoluteLink
              ? `<div style="margin: 30px 0;">
                   <a href="${absoluteLink}" style="background-color: #fff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open in the newsroom</a>
                 </div>`
              : ""
          }
          <p style="font-size: 14px; color: #666; border-top: 1px solid #333; padding-top: 20px;">
            You are receiving this because email alerts are on for your account.
            Turn them off under Settings in the newsroom console.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send notification email";
    console.error("[email] Failed to send notification email:", msg);
    return { success: false, error: msg };
  }
}
