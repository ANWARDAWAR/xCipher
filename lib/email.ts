// Edge-safe email utility using native fetch API against Resend REST endpoint

export async function sendEmail({ to, subject, html, from }: { to: string; subject: string; html: string; from?: string }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error("[email] RESEND_API_KEY is missing");
    throw new Error("RESEND_API_KEY is missing");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from || process.env.EMAIL_FROM_ADDRESS || "xSypher <noreply@xsypher.com>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("Resend API Error:", errorText);
    throw new Error(`Failed to send email: ${errorText}`);
  }
  return await res.json();
}

interface SendInvitationEmailParams {
  to: string;
  role: string;
  inviteUrl: string;
}

export async function sendInvitationEmail({ to, role, inviteUrl }: SendInvitationEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set; invitation not sent to", to);
    return { success: false, error: "Email delivery is not configured." };
  }
  
  try {
    const data = await sendEmail({
      to,
      subject: "You have been invited to join xSypher",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">You have been granted clearance.</h2>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
            You've been invited to join the xSypher editorial desk as a <strong>${role}</strong>.
          </p>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
            Click the secure link below to authenticate and set up your account. This link will automatically expire in 48 hours for security purposes.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${inviteUrl}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Accept Invitation</a>
          </div>
          <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
            If you did not expect this invitation, you can safely ignore this dispatch.
          </p>
        </div>
      `,
    });

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
  if (!process.env.RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY is not set; password reset not sent to", to);
    return { success: false, error: "Email delivery is not configured." };
  }
  
  try {
    const data = await sendEmail({
      to,
      subject: "Reset your xSypher password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
            <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
          </div>
          <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">Security Alert: Credential Reset Request.</h2>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
            We received a request to reset the master password for your xSypher account.
          </p>
          <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
            Click the secure button below to establish a new password. This authentication token will expire in exactly 1 hour.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
            If you did not initiate this password reset protocol, you can safely ignore this email. Your current credentials will remain intact.
          </p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send password reset email:", error);
    return { success: false, error: error.message };
  }
}

interface SendNotificationEmailParams {
  to: string;
  recipientName?: string | null;
  message: string;
  link?: string | null;
}

function escapeHtml(value: string) {
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
  if (!process.env.RESEND_API_KEY) {
    return { success: false, skipped: true as const, error: "RESEND_API_KEY is not set" };
  }

  const base = process.env.NEXTAUTH_URL || "";
  const absoluteLink = link && base ? `${base}${link}` : null;
  const safeMessage = escapeHtml(message);
  const greeting = recipientName ? `Hello ${escapeHtml(recipientName)},` : "Hello,";

  try {
    const data = await sendEmail({
      to,
      subject: message.length > 90 ? `${message.slice(0, 87)}...` : message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px; font-weight: bold; letter-spacing: -0.05em;">x<span style="color: #f04552;">Sypher</span></h1>
          <p style="font-size: 16px; color: #ccc;">${greeting}</p>
          <p style="font-size: 16px; color: #ccc;">${safeMessage}</p>
          ${
            absoluteLink
              ? `<div style="margin: 30px 0;">
                   <a href="${absoluteLink}" style="background-color: #f04552; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Open in the newsroom</a>
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

    return { success: true, data };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to send notification email";
    console.error("[email] Failed to send notification email:", msg);
    return { success: false, error: msg };
  }
}
