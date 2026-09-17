import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendInvitationEmailParams {
  to: string;
  role: string;
  inviteUrl: string;
}

export async function sendInvitationEmail({ to, role, inviteUrl }: SendInvitationEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: "xCipher <onboarding@resend.dev>", // Typically you'd use your verified domain here
      to,
      subject: "You have been invited to join xCipher",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111; color: #fff; padding: 20px; border-radius: 8px;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">x<span style="color: #666;">Cipher</span></h1>
          <p style="font-size: 16px; color: #ccc;">Hello,</p>
          <p style="font-size: 16px; color: #ccc;">You have been invited to join the xCipher newsroom as a <strong>${role}</strong>.</p>
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
