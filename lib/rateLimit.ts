/**
 * lib/rateLimit.ts
 *
 * Lightweight in-memory, IP-based rate limiter.
 * Works per-serverless-function instance; does not share state across replicas.
 * Suitable for Next.js on Vercel/Supabase without Redis.
 *
 * Usage:
 *   const result = checkRateLimit("newsletter", ip, { limit: 3, windowMs: 10 * 60 * 1000 });
 *   if (!result.allowed) return { success: false, error: "Too many requests." };
 */

import { db } from "./db";
import { eq, lt } from "drizzle-orm";
import { rateLimit as rateLimitTable } from "./db/schema";


interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check and record a rate-limit hit for a given action + key (typically an IP).
 * Returns { allowed: true } when under the limit.
 */
export async function checkRateLimit(
  action: string,
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const mapKey = `${action}:${key}`;
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);

  // Stochastic prune: 1% chance to clean expired tokens to prevent table bloat
  if (Math.random() < 0.01) {
    db.delete(rateLimitTable).where(lt(rateLimitTable.resetAt, now)).catch(console.error);
  }

  let [entry] = await db.select().from(rateLimitTable).where(eq(rateLimitTable.actionKey, mapKey)).limit(1);

  if (!entry || entry.resetAt < now) {
    const [newEntry] = await db.insert(rateLimitTable).values({
      id: crypto.randomUUID(),
      actionKey: mapKey, count: 1, resetAt
    }).onConflictDoUpdate({
      target: rateLimitTable.actionKey,
      set: { count: 1, resetAt }
    }).returning();
    entry = newEntry;
    return { allowed: true, remaining: Math.max(0, options.limit - 1), resetAt: entry.resetAt.getTime() };
  }

  if (entry.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt.getTime() };
  }

  const [updatedEntry] = await db.update(rateLimitTable).set({
    count: entry.count + 1
  }).where(eq(rateLimitTable.actionKey, mapKey)).returning();
  entry = updatedEntry;

  return { allowed: true, remaining: Math.max(0, options.limit - entry.count), resetAt: entry.resetAt.getTime() };
}

/**
 * Extract the best available IP address from Next.js request headers.
 * Reads x-forwarded-for (set by Vercel/proxies) with a fallback to a constant.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
