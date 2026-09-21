import { describe, it, expect } from "vitest";
import { deriveIsFeatured } from "../lib/utils";

describe("deriveIsFeatured", () => {
  it("returns false for null placement", () => {
    expect(deriveIsFeatured(null)).toBe(false);
  });

  it("returns false for empty string placement", () => {
    expect(deriveIsFeatured("")).toBe(false);
  });

  it("returns true for HERO placement", () => {
    expect(deriveIsFeatured("HERO")).toBe(true);
  });

  it("returns true for FEATURED_STORIES placement", () => {
    expect(deriveIsFeatured("FEATURED_STORIES")).toBe(true);
  });
});
