import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPassword } from "../app/actions/password-reset";
import { db } from "../lib/db";

vi.mock("../lib/db", () => ({
  db: {
    passwordResetToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      const tx = {
        user: { update: vi.fn() },
        passwordResetToken: { update: vi.fn() },
        auditLog: { create: vi.fn() }
      };
      return cb(tx);
    }),
  }
}));

describe("Password Reset Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Password validation", () => {
    it("rejects passwords shorter than 8 characters", async () => {
      const result = await resetPassword("sometoken", "short");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/at least 8 characters/);
      expect(db.passwordResetToken.findUnique).not.toHaveBeenCalled();
    });

    it("proceeds to token validation if password is 8 or more characters", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue(null);
      
      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid or expired/);
      expect(db.passwordResetToken.findUnique).toHaveBeenCalledWith({ where: { token: "sometoken" }});
    });
  });

  describe("Token expiry check", () => {
    it("returns correct error string for expired token", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() - 10000),
        used: false,
        createdAt: new Date(),
      } as any);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/has expired/);
    });

    it("returns correct error string for already used token", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() + 10000),
        used: true,
        createdAt: new Date(),
      } as any);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid or expired/);
    });

    it("returns success when valid token and valid password", async () => {
      vi.mocked(db.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() + 100000),
        used: false,
        createdAt: new Date(),
      } as any);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(true);
      expect(db.$transaction).toHaveBeenCalled();
    });
  });
});
