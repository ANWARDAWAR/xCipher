import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPassword } from "../app/actions/password-reset";
import { db } from "../lib/db";

const { mockLimit, mockWhere, mockFrom, mockSelect, mockTx } = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockFrom = vi.fn(() => ({ where: mockWhere }));
  const mockSelect = vi.fn(() => ({ from: mockFrom }));
  const mockTx = {
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: vi.fn() })),
  };
  return { mockLimit, mockWhere, mockFrom, mockSelect, mockTx };
});

vi.mock("../lib/db", () => ({
  db: {
    select: mockSelect,
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn() })) })),
    insert: vi.fn(() => ({ values: vi.fn() })),
    transaction: vi.fn(async (cb) => cb(mockTx)),
  }
}));

describe("Password Reset Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLimit.mockReset();
    mockWhere.mockClear();
    mockFrom.mockClear();
    mockSelect.mockClear();
  });

  describe("Password validation", () => {
    it("rejects passwords shorter than 8 characters", async () => {
      const result = await resetPassword("sometoken", "short");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/at least 8 characters/);
      expect(mockSelect).not.toHaveBeenCalled();
    });

    it("proceeds to token validation if password is 8 or more characters", async () => {
      mockLimit.mockResolvedValueOnce([]);
      
      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid or expired/);
      expect(mockSelect).toHaveBeenCalled();
    });
  });

  describe("Token expiry check", () => {
    it("returns correct error string for expired token", async () => {
      mockLimit.mockResolvedValueOnce([{
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() - 10000),
        used: false,
        createdAt: new Date(),
      }]);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/has expired/);
    });

    it("returns correct error string for already used token", async () => {
      mockLimit.mockResolvedValueOnce([{
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() + 10000),
        used: true,
        createdAt: new Date(),
      }]);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Invalid or expired/);
    });

    it("returns success when valid token and valid password", async () => {
      mockLimit.mockResolvedValueOnce([{
        id: "token-1",
        userId: "user-1",
        token: "sometoken",
        expires: new Date(Date.now() + 100000),
        used: false,
        createdAt: new Date(),
      }]);

      const result = await resetPassword("sometoken", "validpassword123");
      expect(result.success).toBe(true);
      expect(db.update).toHaveBeenCalled();
    });
  });
});
