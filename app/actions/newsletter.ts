"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { subscriber as subscriberTable } from "@/lib/db/schema";
import { randomHex } from "@/lib/utils";

import { sendEmail } from "@/lib/email";
const emailSchema = z.string().email().max(320).transform((e) => e.toLowerCase().trim());

function getNewsletterConfig() {
  const env = process.env;
  return {
    siteUrl: env.NEXT_PUBLIC_SITE_URL || "https://xsypher.com",
    from: env.NEWSLETTER_FROM_EMAIL || "newsletter@xsypher.com",
  };
}

export async function subscribeNewsletter(
  email: string,
  source: string = "HOMEPAGE"
) {
  const { siteUrl, from } = getNewsletterConfig();

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
    const [existing] = await db.select().from(subscriberTable).where(eq(subscriberTable.email, normalizedEmail)).limit(1);
    let subscriber = existing;

    if (existing) {
      if (existing.status === "ACTIVE") {
        return { success: false, code: "ALREADY_SUBSCRIBED", error: "This email is already subscribed." };
      }
      
      const [updated] = await db.update(subscriberTable).set({
        status: "ACTIVE", consentAt: new Date(), source, updatedAt: new Date()
      }).where(eq(subscriberTable.id, existing.id)).returning();
      subscriber = updated;
    } else {
      const [created] = await db.insert(subscriberTable).values({
        id: crypto.randomUUID(),
        email: normalizedEmail,
        status: "ACTIVE",
        source,
        consentAt: new Date(),
        unsubscribeToken: randomHex(32),
        updatedAt: new Date(),
      }).returning();
      subscriber = created;
    }

    // Try sending Welcome Email via Resend
    try {
      const unsubscribeUrl = `${siteUrl}/unsubscribe/${subscriber.unsubscribeToken}`;
      await sendEmail({
        from: `xSypher <${from}>`,
        to: normalizedEmail,
        subject: "Welcome to xSypher",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0c0d10; color: #ffffff; padding: 40px 32px; border-radius: 12px; border: 1px solid #1f2127;">
            <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #1f2127; padding-bottom: 24px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: -0.05em; margin: 0;">x<span style="color: #f04552;">Sypher</span></h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #ffffff;">Welcome to the xSypher Desk.</h2>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 24px;">
              You are now part of an exclusive list receiving uncompromising intelligence and technical analysis.
            </p>
            <p style="font-size: 16px; color: #a1a1aa; line-height: 1.6; margin-top: 0; margin-bottom: 32px;">
              We'll keep you informed on our latest publications, security dispatches, and insights directly in your inbox.
            </p>
            <div style="margin: 32px 0; text-align: center;">
              <a href="${siteUrl}" style="background-color: #f04552; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; display: inline-block;">Read Latest Dispatches</a>
            </div>
            <p style="font-size: 13px; color: #52525b; border-top: 1px solid #1f2127; padding-top: 24px; margin-bottom: 0; text-align: center;">
              To terminate your subscription, <a href="${unsubscribeUrl}" style="color: #a1a1aa; text-decoration: underline;">click here to unsubscribe</a>.
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
  const { siteUrl, from } = getNewsletterConfig();
  const user = await getCurrentUser();
  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized. Only OWNER or ADMIN can send broadcasts." };
  }

  if (!subject || !htmlContent) {
    return { success: false, error: "Subject and content are required." };
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("Brevo API key is missing. Please add it to your .env file.");
  }

  try {
    const activeSubscribers = await db.select({ email: subscriberTable.email, unsubscribeToken: subscriberTable.unsubscribeToken })
      .from(subscriberTable)
      .where(eq(subscriberTable.status, "ACTIVE"));

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
        To unsubscribe from these emails, <a href="${siteUrl}/unsubscribe/{{params.UNSUBSCRIBE_TOKEN}}" style="color: #666;">click here</a>.
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
          "accept": "application/json",
          "api-key": apiKey,
          "content-type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: "xSypher", email: from },
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

    return { success: true, message: `Broadcast successfully sent to ${activeSubscribers.length} subscribers.` };
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
    const [subscriber] = await db.select().from(subscriberTable).where(eq(subscriberTable.unsubscribeToken, token)).limit(1);

    if (!subscriber) {
      return { success: false, error: "This unsubscribe link is invalid or has already been used." };
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return { success: true, message: "You are already unsubscribed.", alreadyDone: true };
    }

    await db.update(subscriberTable)
      .set({ status: "UNSUBSCRIBED", updatedAt: new Date() })
      .where(eq(subscriberTable.id, subscriber.id));

    return { success: true, message: "You have been unsubscribed successfully." };
  } catch (error: any) {
    console.error("[newsletter] unsubscribeByToken error:", error);
    return { success: false, error: "Failed to process unsubscribe request." };
  }
}

export async function adminUnsubscribeUser(email: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized. Only OWNER or ADMIN can perform this action." };
  }
  
  try {
    const [subscriber] = await db.select().from(subscriberTable).where(eq(subscriberTable.email, email)).limit(1);
    if (!subscriber) return { success: false, error: "Subscriber not found." };
    
    await db.update(subscriberTable)
      .set({ status: "UNSUBSCRIBED", updatedAt: new Date() })
      .where(eq(subscriberTable.email, email));
    return { success: true, message: `Successfully unsubscribed ${email}.` };
  } catch (error) {
    console.error("[newsletter] adminUnsubscribeUser error:", error);
    return { success: false, error: "Failed to unsubscribe user." };
  }
}

export async function adminDeleteSubscriber(email: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "OWNER" && user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized. Only OWNER or ADMIN can perform this action." };
  }
  
  try {
    await db.delete(subscriberTable).where(eq(subscriberTable.email, email));
    return { success: true, message: `Successfully deleted ${email} from database.` };
  } catch (error) {
    console.error("[newsletter] adminDeleteSubscriber error:", error);
    return { success: false, error: "Failed to delete subscriber." };
  }
}
