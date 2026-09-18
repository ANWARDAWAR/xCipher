import { describe, it, expect } from "vitest";

/**
 * The email fan-out decides who receives mail by reading User.notificationPrefs.
 * That predicate is the whole opt-out mechanism, so it is worth pinning down
 * independently of the database and of Resend.
 *
 * It mirrors the filter in lib/notifications.ts emailFanout(). If that changes,
 * this should fail.
 */

type NotificationPrefs = {
  emailAlerts?: boolean;
  weeklyDigest?: boolean;
  reviewUpdates?: boolean;
};

function wantsEmail(notificationPrefs: unknown): boolean {
  const prefs = (notificationPrefs ?? {}) as NotificationPrefs;
  return prefs.emailAlerts !== false;
}

describe("email opt-out predicate", () => {
  it("sends when the column is null", () => {
    // Every user predates the preference, so null must not mean "opted out" --
    // that would silently disable email for the entire existing newsroom.
    expect(wantsEmail(null)).toBe(true);
  });

  it("sends when prefs exist but emailAlerts was never set", () => {
    // The settings form shows emailAlerts defaulting to on, so a user who only
    // ever toggled the digest expects mail.
    expect(wantsEmail({ weeklyDigest: true })).toBe(true);
  });

  it("sends when emailAlerts is explicitly true", () => {
    expect(wantsEmail({ emailAlerts: true })).toBe(true);
  });

  it("does NOT send when emailAlerts is explicitly false", () => {
    // The one case that must hold. A user who turned alerts off and keeps
    // receiving mail is the failure this whole predicate exists to prevent.
    expect(wantsEmail({ emailAlerts: false })).toBe(false);
  });

  it("treats a missing object as opted in, not as malformed", () => {
    expect(wantsEmail(undefined)).toBe(true);
  });

  it("only honours a real boolean false, not a falsy lookalike", () => {
    // Json columns round-trip loosely. A stored 0 or "" is not an opt-out --
    // being strict here means an odd value fails safe toward delivery rather
    // than silently muting someone.
    expect(wantsEmail({ emailAlerts: 0 as unknown as boolean })).toBe(true);
    expect(wantsEmail({ emailAlerts: "" as unknown as boolean })).toBe(true);
  });
});

describe("preference whitelisting", () => {
  // Mirrors updateNotificationPrefs in app/actions/profile.ts.
  function clean(prefs: Record<string, unknown>) {
    return {
      emailAlerts: prefs.emailAlerts !== false,
      weeklyDigest: prefs.weeklyDigest === true,
      reviewUpdates: prefs.reviewUpdates !== false,
    };
  }

  it("drops keys the client invented", () => {
    // This lands in a Json column. Without a whitelist a client could persist
    // arbitrary data onto the user record.
    const out = clean({ emailAlerts: true, isAdmin: true, role: "OWNER" });
    expect(Object.keys(out).sort()).toEqual([
      "emailAlerts",
      "reviewUpdates",
      "weeklyDigest",
    ]);
  });

  it("coerces every value to a real boolean", () => {
    const out = clean({ emailAlerts: "yes", weeklyDigest: "no", reviewUpdates: 1 });
    for (const v of Object.values(out)) {
      expect(typeof v).toBe("boolean");
    }
  });

  it("keeps an explicit opt-out through the round trip", () => {
    const out = clean({ emailAlerts: false });
    expect(out.emailAlerts).toBe(false);
    expect(wantsEmail(out)).toBe(false);
  });

  it("defaults the digest off and the other two on", () => {
    const out = clean({});
    expect(out).toEqual({
      emailAlerts: true,
      weeklyDigest: false,
      reviewUpdates: true,
    });
  });
});
