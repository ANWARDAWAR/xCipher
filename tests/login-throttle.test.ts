import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  peekRateLimit,
  resetRateLimit,
  getClientIp,
  getClientIpFromRecord,
} from "@/lib/rateLimit";

// The failure-only counter model that lib/login-throttle builds on these
// primitives: peek (free) before a password check, record (counts) only on
// failure, reset on success. These tests pin that contract so the throttle
// cannot silently degrade into the two traps the audit flagged: counting
// successful logins toward the lockout, or never letting an honest user back
// in.

const LIMITS = { limit: 3, windowMs: 60_000 };

beforeEach(() => {
  // The limiter keeps module-level state; reset the keys each test touches.
  resetRateLimit("test-action", "key-a");
  resetRateLimit("test-action", "key-b");
});

describe("peekRateLimit", () => {
  it("reports the current window without consuming budget", () => {
    const first = peekRateLimit("test-action", "key-a", LIMITS);
    const second = peekRateLimit("test-action", "key-a", LIMITS);
    expect(first.allowed).toBe(true);
    expect(second.remaining).toBe(first.remaining);
  });

  it("reflects failures recorded by checkRateLimit", () => {
    checkRateLimit("test-action", "key-a", LIMITS);
    checkRateLimit("test-action", "key-a", LIMITS);
    const peeked = peekRateLimit("test-action", "key-a", LIMITS);
    expect(peeked.remaining).toBe(1);
    expect(peeked.allowed).toBe(true);
  });
});

describe("the login-throttle pattern", () => {
  it("blocks after the failure limit and clears on reset (successful login)", () => {
    for (let i = 0; i < LIMITS.limit; i++) {
      expect(peekRateLimit("test-action", "key-a", LIMITS).allowed).toBe(true);
      checkRateLimit("test-action", "key-a", LIMITS);
    }
    // At the cap: peek refuses before any password check is attempted.
    expect(peekRateLimit("test-action", "key-a", LIMITS).allowed).toBe(false);
    // A correct sign-in resets the account counter...
    resetRateLimit("test-action", "key-a");
    expect(peekRateLimit("test-action", "key-a", LIMITS).allowed).toBe(true);
    // ...and has not touched a different scope's counter.
    checkRateLimit("test-action", "key-b", LIMITS);
    expect(peekRateLimit("test-action", "key-b", LIMITS).remaining).toBe(2);
  });
});

describe("client IP extraction", () => {
  it("takes the first x-forwarded-for hop from a Headers instance", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("203.0.113.9");
  });

  it("takes the first hop from the authorize() header record", () => {
    expect(
      getClientIpFromRecord({ "x-forwarded-for": "198.51.100.4, 10.0.0.1" })
    ).toBe("198.51.100.4");
  });

  it("accepts array-valued headers and falls back to a constant", () => {
    expect(getClientIpFromRecord({ "x-forwarded-for": ["192.0.2.7", "10.0.0.1"] })).toBe("192.0.2.7");
    expect(getClientIpFromRecord(undefined)).toBe("unknown");
    expect(getClientIpFromRecord({})).toBe("unknown");
  });
});
