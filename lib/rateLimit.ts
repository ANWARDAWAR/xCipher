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

interface Entry {
  count: number;
  resetAt: number;
}

// Global map keyed by "action:ip"
const store = new Map<string, Entry>();

// Periodically prune expired entries to prevent unbounded memory growth
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 60_000); // prune every minute
}

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
export function checkRateLimit(
  action: string,
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const mapKey = `${action}:${key}`;
  const now = Date.now();

  const existing = store.get(mapKey);

  if (!existing || existing.resetAt < now) {
    // First request or window expired — start a fresh window
    const entry: Entry = { count: 1, resetAt: now + options.windowMs };
    store.set(mapKey, entry);
    return { allowed: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
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
