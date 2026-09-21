"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

const emailSchema = z.string().email().max(320).transform((e) => e.toLowerCase().trim());

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

    if (existing) {
      if (existing.status === "ACTIVE") {
        return { success: false, code: "ALREADY_SUBSCRIBED", error: "This email is already subscribed." };
      }
      // Re-subscribe: reset status to ACTIVE and refresh consent timestamp
      await db.subscriber.update({
        where: { id: existing.id },
        data: { status: "ACTIVE", consentAt: new Date(), source, updatedAt: new Date() },
      });
      return { success: true, message: "Welcome back — you're back on the list." };
    }

    await db.subscriber.create({
      data: {
        email: normalizedEmail,
        status: "ACTIVE",
        source,
        consentAt: new Date(),
      },
    });

    return { success: true, message: "You're on the list." };
  } catch (error: any) {
    console.error("[newsletter] subscribeNewsletter error:", error);
    return { success: false, error: "Failed to process subscription. Please try again." };
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
