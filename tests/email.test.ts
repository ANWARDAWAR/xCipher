import { describe, it, expect } from "vitest";
import { sendNotificationEmail, sendInvitationEmail } from "@/lib/email";

/**
 * Regression guard for a real crash.
 *
 * `new Resend(undefined)` throws "Missing API key" at construction time, and
 * the client used to be built at module scope. So merely importing lib/email.ts
 * crashed whenever RESEND_API_KEY was absent -- the normal state locally, in CI,
 * and for any newsroom running in-app notifications only.
 *
 * That was survivable while the only caller was the invitation flow. It stopped
 * being survivable once lib/notifications.ts started importing this on every
 * workflow transition. These tests fail if the client ever moves back to module
 * scope.
 */
describe("email module without configuration", () => {
  it("can be imported and called with no API key set", () => {
    delete process.env.RESEND_API_KEY;
    expect(typeof sendNotificationEmail).toBe("function");
    expect(typeof sendInvitationEmail).toBe("function");
  });

  it("reports a notification as skipped instead of throwing", async () => {
    delete process.env.RESEND_API_KEY;
    const res = await sendNotificationEmail({
      to: "reader@example.test",
      message: "\"Quantum chips\" was submitted for review.",
      link: "/admin/review/abc",
    });
    expect(res.success).toBe(false);
    expect((res as { skipped?: boolean }).skipped).toBe(true);
  });

  it("reports an invitation as failed instead of throwing", async () => {
    // Invitations do NOT skip quietly: a vanished invitation strands someone
    // waiting for a link, so the caller must be able to tell the user.
    delete process.env.RESEND_API_KEY;
    const res = await sendInvitationEmail({
      to: "newcomer@example.test",
      role: "AUTHOR",
      inviteUrl: "https://example.test/invite/xyz",
    });
    expect(res.success).toBe(false);
    expect((res as { skipped?: boolean }).skipped).toBeUndefined();
  });
});
