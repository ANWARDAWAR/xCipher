import crypto from "node:crypto";
import { db } from "@/lib/db";
import {
  checkRateLimit,
  peekRateLimit,
  resetRateLimit,
  getClientIpFromRecord,
} from "@/lib/rateLimit";

// ─────────────────────────────────────────────────────────────────────────────
// Login throttling
// ─────────────────────────────────────────────────────────────────────────────
//
// The credentials endpoint used to accept unlimited attempts: every request ran
// a bcrypt comparison with no attempt counter at all. On an admin CMS, that is
// the single most valuable endpoint to credential-stuff -- one OWNER account is
// the whole publication -- and it also doubles as a CPU-exhaustion vector
// (bcrypt is slow on purpose).
//
// The model here is the standard failure-only counter, at two scopes:
//
//   per account  5 failed attempts / 15 min   (stops targeted guessing)
//   per IP       20 failed attempts / 15 min  (stops spraying across accounts,
//                                               without locking out an office
//                                               behind one NAT address)
//
// Correct logins are never counted: peek before the password check, record only
// after a failed check, clear the account counter on success.
//
// The limiter is in-memory (see lib/rateLimit.ts), so on a multi-instance
// deployment the effective limit multiplies by the instance count. It is still
// strictly better than nothing -- and attempting to share state would pull in
// an external store the project does not have. Every failure and every throttle
// event lands in the AuditLog, which *is* shared, so an attack remains visible
// across instances.
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_LIMIT = { limit: 5, windowMs: 15 * 60_000 };
const IP_LIMIT = { limit: 20, windowMs: 15 * 60_000 };

/** Keys are built from the lowercased address so "Admin@x.com" and
 *  "admin@x.com" share one counter even if the lookup is case-sensitive. */
function accountAction(email: string): string {
  return `login-acct:${email.toLowerCase()}`;
}

function ipAction(ip: string): string {
  return `login-ip:${ip}`;
}

/** True when neither the account nor the IP is inside a lockout window. */
export function isLoginAllowed(email: string, ip: string): boolean {
  return (
    peekRateLimit(accountAction(email), "failures", ACCOUNT_LIMIT).allowed &&
    peekRateLimit(ipAction(ip), "failures", IP_LIMIT).allowed
  );
}

/** Clears the account counter after a successful sign-in. The IP counter is
 *  deliberately kept: clearing it would let a distributed attack reset its
 *  own budget by including one valid credential in the mix. */
export function clearLoginFailures(email: string): void {
  resetRateLimit(accountAction(email), "failures");
}

/** IPs are hashed before they touch the audit table: a breach of the logs
 *  should not hand out the visitor list, and nobody ever needs to read a
 *  login IP out of the audit UI. */
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

async function auditLoginEvent(
  action: string,
  email: string,
  ip: string,
  userAgent: string | null
): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        userId: null,
        action,
        entityType: "auth",
        entityId: null,
        details: {
          email: email.toLowerCase(),
          ipHash: hashIp(ip),
          userAgent: userAgent?.slice(0, 200) ?? null,
        },
      },
    });
  } catch (error) {
    // Auth must never fail because the audit write did -- the correct failure
    // mode of a login response is decided by the credentials, not the log.
    console.error("[auth] login audit write failed:", error);
  }
}

/** Counts a failed attempt against both scopes and writes the audit row. */
export function recordLoginFailure(
  email: string,
  ip: string,
  userAgent: string | null
): void {
  checkRateLimit(accountAction(email), "failures", ACCOUNT_LIMIT);
  checkRateLimit(ipAction(ip), "failures", IP_LIMIT);
  void auditLoginEvent("auth.login.failed", email, ip, userAgent);
}

/**
 * Records that a request was refused without a password check. Audited too --
 * that is the moment an attack becomes undeniable -- but the write itself is
 * rate-limited (1/min per account) so a flood cannot turn the audit table
 * into the amplification target.
 */
export function recordLoginThrottled(
  email: string,
  ip: string,
  userAgent: string | null
): void {
  const budget = checkRateLimit(`login-audit:${email.toLowerCase()}`, "writes", {
    limit: 1,
    windowMs: 60_000,
  });
  if (budget.allowed) {
    void auditLoginEvent("auth.login.throttled", email, ip, userAgent);
  }
}

/** Reads the client address from the headers next-auth hands to authorize().
 *  Delegates to the shared implementation so the two header shapes in the app
 *  (Headers vs plain record) never drift apart. */
export function ipFromAuthorizeHeaders(
  headers: Record<string, string | string[] | undefined> | undefined
): string {
  return getClientIpFromRecord(headers);
}
