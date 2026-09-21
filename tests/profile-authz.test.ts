import { describe, it, expect } from "vitest";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";

// The rule updateProfile enforces for cross-user edits. Kept as a capability
// test because the action itself imports lib/db and cannot be unit-tested.
describe("who may edit another user's profile", () => {
  it.each(["OWNER"] as Role[])("%s can", (r) => {
    expect(authorize(r, "author.manage.all")).toBe(true);
  });
  it("ADMIN cannot", () => {
    expect(authorize("ADMIN", "author.manage.all")).toBe(false);
  });

  it.each(["EDITOR", "AUTHOR", "REVIEWER", "MODERATOR", "STAFF"] as Role[])("%s cannot", (r) => {
    expect(authorize(r, "author.manage.all")).toBe(false);
  });

  it("everyone with console access can still edit their own", () => {
    for (const r of ["OWNER", "ADMIN", "EDITOR", "AUTHOR", "REVIEWER", "MODERATOR"] as Role[]) {
      expect(authorize(r, "author.manage.own")).toBe(true);
    }
  });

  it("role assignment stays narrower than profile editing", () => {
    // OWNER may edit a colleague's profile and also set their official role;
    // ADMIN may edit the profile but not the role; EDITOR may do neither.
    expect(authorize("OWNER", "author.manage.all")).toBe(true);
    expect(authorize("OWNER", "user.manage")).toBe(true);
    expect(authorize("ADMIN", "author.manage.all")).toBe(false);
    expect(authorize("ADMIN", "user.manage")).toBe(false);
    expect(authorize("EDITOR", "author.manage.all")).toBe(false);
    expect(authorize("EDITOR", "user.manage")).toBe(false);
  });
});
