"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { Resend } from "resend";
import { getCurrentUser } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY || "re_test");
const emailSchema = z.string().email().max(320).transform((e) => e.toLowerCase().trim());
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://xsypher.com";
const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM_EMAIL || "newsletter@xsypher.com";

export async function subscribeNewsletter(
  email: string,
  source: string = "HOMEPAGE"
) {
  // Rate limit: 3 signups per 10 minutes per IP
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await checkRateLimit("newsletter", ip, { limit: 3, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return { success: false, error: "Too many requests. Please try again later." };
  }

  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) {
    return { success: false, error: "Please enter a valid email address." };
  }
  const normalizedEmail = parsed.data;

  try {
    const existing = await db.subscriber.findUnique({ where: { email: normalizedEmail } });
    let subscriber = existing;

    if (existing) {
      if (existing.status === "ACTIVE") {
        return { success: false, code: "ALREADY_SUBSCRIBED", error: "This email is already subscribed." };
      }
      // Re-subscribe: reset status to ACTIVE and refresh consent timestamp
      subscriber = await db.subscriber.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", consentAt: new Date(), source, updatedAt: new Date() },
      });
    } else {
      subscriber = await db.subscriber.create({
        data: {
          email: normalizedEmail,
          status: "ACTIVE",
          source,
          consentAt: new Date(),
        },
      });
    }

    // Try sending Welcome Email via Resend
    try {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe/${subscriber.unsubscribeToken}`;
      await resend.emails.send({
        from: `xSypher <${NEWSLETTER_FROM}>`,
        to: normalizedEmail,
        subject: "Welcome to xSypher",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
            <h2>Welcome to the list!</h2>
            <p>You're now subscribed to updates from xSypher.</p>
            <p>We'll keep you informed on our latest publications, news, and insights.</p>
            <br/>
            <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">
              Don't want these emails? <a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe here</a>.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("[newsletter] Welcome email send failed:", emailError);
      // Fail silently for the user so they are still subscribed in the DB
    }

    return { success: true, message: existing ? "Welcome back — you're back on the list." : "You're on the list." };
  } catch (error: any) {
    console.error("[newsletter] subscribeNewsletter error:", error);
    return { success: false, error: "Failed to process subscription. Please try again." };
  }
}

export async function sendNewsletterBroadcast(subject: string, htmlContent: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized. Only OWNER or ADMIN can send broadcasts." };
  }

  if (!subject || !htmlContent) {
    return { success: false, error: "Subject and content are required." };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Brevo API key is not configured." };
  }

  try {
    const activeSubscribers = await db.subscriber.findMany({
      where: { status: "ACTIVE" },
      select: { email: true, unsubscribeToken: true }
    });

    if (activeSubscribers.length === 0) {
      return { success: false, error: "No active subscribers found." };
    }

    // Process in batches of 300 to respect limits
    const BATCH_SIZE = 300;
    const batches = [];
    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      batches.push(activeSubscribers.slice(i, i + BATCH_SIZE));
    }

    const htmlWithFooter = `
      ${htmlContent}
      <br/><br/>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 20px 0;" />
      <p style="font-size: 12px; color: #666;">
        To unsubscribe from these emails, <a href="${SITE_URL}/unsubscribe/{{params.UNSUBSCRIBE_TOKEN}}" style="color: #666;">click here</a>.
      </p>
    `;

    for (const batch of batches) {
      const messageVersions = batch.map(sub => ({
        to: [{ email: sub.email }],
        params: { UNSUBSCRIBE_TOKEN: sub.unsubscribeToken }
      }));

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "xSypher", email: NEWSLETTER_FROM },
          subject: subject,
          htmlContent: htmlWithFooter,
          messageVersions
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        console.error("[newsletter] Brevo broadcast error:", errData);
        return { success: false, error: "Failed to dispatch one or more batches via Brevo." };
      }
    }

    return { success: true, message: \`Broadcast successfully sent to \${activeSubscribers.length} subscribers.\` };
  } catch (error: any) {
    console.error("[newsletter] sendNewsletterBroadcast error:", error);
    return { success: false, error: "Failed to send newsletter broadcast." };
  }
}

export async function unsubscribeByToken(token: string) {
  if (!token || typeof token !== "string" || token.length > 128) {
    return { success: false, error: "Invalid unsubscribe link." };
  }

  try {
    const subscriber = await db.subscriber.findUnique({ where: { unsubscribeToken: token } });

    if (!subscriber) {
      return { success: false, error: "This unsubscribe link is invalid or has already been used." };
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return { success: true, message: "You are already unsubscribed.", alreadyDone: true };
    }

    await db.subscriber.update({
      where: { id: subscriber.id },
      data: { status: "UNSUBSCRIBED" },
    });

    return { success: true, message: "You have been unsubscribed successfully." };
  } catch (error: any) {
    console.error("[newsletter] unsubscribeByToken error:", error);
    return { success: false, error: "Failed to process unsubscribe request." };
  }
}
