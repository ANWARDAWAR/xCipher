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
 * Read the current rate-limit state for an action + key WITHOUT recording a hit.
 *
 * Authentication needs this distinction: a login page that incremented on
 * every attempt -- including correct ones -- would lock out a legitimate user
 * for signing in a few times in a row. The correct pattern is: peek before the
 * password check (fail fast when throttled), record only on a *failed* check,
 * reset on success. Public form endpoints keep using checkRateLimit() because
 * every submission is equally expensive for them.
 */
export function peekRateLimit(
  action: string,
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const mapKey = `${action}:${key}`;
  const now = Date.now();
  const existing = store.get(mapKey);

  if (!existing || existing.resetAt < now) {
    return { allowed: true, remaining: options.limit, resetAt: now + options.windowMs };
  }
  if (existing.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  return { allowed: true, remaining: options.limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Remove the counter for an action + key. Used to clear recorded login
 * failures after a successful sign-in, so honest users recovering from a typo
 * are not punished for the rest of the window.
 */
export function resetRateLimit(action: string, key: string): void {
  store.delete(`${action}:${key}`);
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

/**
 * The same extraction for the plain lowercase-keyed header record that
 * next-auth hands to authorize(), which is not a Headers instance.
 */
export function getClientIpFromRecord(
  headers: Record<string, string | string[] | undefined> | undefined
): string {
  const forwarded = headers?.["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return first?.split(",")[0].trim() || "unknown";
}
