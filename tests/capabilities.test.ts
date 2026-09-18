import { describe, it, expect } from "vitest";
import type { Role } from "@prisma/client";
import {
  authorize,
  buildArticleScope,
  ROLE_CAPABILITIES,
  type Capability,
} from "@/lib/capabilities";

/**
 * Tests for the capability layer.
 *
 * These are the rules that decide who can do what, and they are pure
 * functions, so they are both the most consequential thing in the codebase to
 * get wrong and the cheapest thing to test. Everything here runs without a
 * database.
 *
 * The emphasis is deliberately on what each role must NOT be able to do.
 * Positive assertions ("an owner can publish") tend to keep passing even when
 * a permission is accidentally widened; negative ones are what actually catch
 * a privilege escalation.
 */

const ALL_ROLES: Role[] = [
  "OWNER",
  "ADMIN",
  "EDITOR",
  "AUTHOR",
  "REVIEWER",
  "MODERATOR",
  "STAFF",
];

describe("authorize", () => {
  it("grants the owner every declared capability", () => {
    // OWNER now holds every capability including permanent deletion, by
    // explicit product decision. Anything missing here is a bug, not a policy.
    const OWNER_EXCLUDED: ReadonlySet<Capability> = new Set<Capability>([]);

    const every = new Set<Capability>();
    for (const caps of Object.values(ROLE_CAPABILITIES)) {
      for (const c of caps) every.add(c);
    }
    for (const c of every) {
      const expected = !OWNER_EXCLUDED.has(c);
      expect(authorize("OWNER", c), `OWNER should ${expected ? "hold" : "not hold"} ${c}`).toBe(
        expected
      );
    }
  });

  it("grants permanent article deletion to OWNER", () => {
    // Reversal of an earlier restriction: the owner is accountable for the
    // publication and needs takedown authority without escalating to another
    // account. The audit trail, not the permission, is the control here.
    expect(authorize("OWNER", "article.delete")).toBe(true);
    expect(authorize("OWNER", "article.delete.own.draft")).toBe(true);
  });

  it("denies an unknown role rather than defaulting to permissive", () => {
    // A role string that is not in the map must fail closed. If this ever
    // returns true, a typo in a role column becomes a superuser.
    expect(authorize("NOT_A_ROLE" as Role, "article.publish")).toBe(false);
  });

  it("keeps STAFF out of the console", () => {
    // STAFF is a public-site-only account. The admin layout relies on this
    // exact check to refuse entry.
    expect(authorize("STAFF", "console.access")).toBe(false);
  });

  it("gives every other role console access", () => {
    for (const role of ALL_ROLES.filter((r) => r !== "STAFF")) {
      expect(authorize(role, "console.access"), role).toBe(true);
    }
  });

  describe("authors are confined to their own drafts", () => {
    const forbidden: Capability[] = [
      "article.publish",
      "article.review",
      "article.edit.any",
      "article.delete",
      "article.archive",
      "article.feature",
      "user.manage",
      "user.invite",
      "audit.view",
      "comment.moderate",
      "settings.publication",
    ];

    for (const capability of forbidden) {
      it(`denies AUTHOR ${capability}`, () => {
        expect(authorize("AUTHOR", capability)).toBe(false);
      });
    }

    it("still lets an author create, edit and submit their own work", () => {
      expect(authorize("AUTHOR", "article.create")).toBe(true);
      expect(authorize("AUTHOR", "article.edit.own")).toBe(true);
      expect(authorize("AUTHOR", "article.submit")).toBe(true);
      expect(authorize("AUTHOR", "article.delete.own.draft")).toBe(true);
    });
  });

  describe("role boundaries that are easy to widen by accident", () => {
    it("does not let an EDITOR manage users", () => {
      // Editors run the newsroom, not the account system. This is the split
      // that lets them reach /admin/authors but not /admin/users.
      expect(authorize("EDITOR", "user.manage")).toBe(false);
      expect(authorize("EDITOR", "user.invite")).toBe(false);
      expect(authorize("EDITOR", "author.manage.all")).toBe(true);
    });

    it("does not let an EDITOR permanently delete or read the audit log", () => {
      expect(authorize("EDITOR", "article.delete")).toBe(false);
      expect(authorize("EDITOR", "audit.view")).toBe(false);
    });

    it("does not let a REVIEWER publish or edit", () => {
      // A reviewer decides; they do not ship.
      expect(authorize("REVIEWER", "article.review")).toBe(true);
      expect(authorize("REVIEWER", "article.publish")).toBe(false);
      expect(authorize("REVIEWER", "article.edit.any")).toBe(false);
      expect(authorize("REVIEWER", "article.create")).toBe(false);
    });

    it("confines a MODERATOR to comments", () => {
      expect(authorize("MODERATOR", "comment.moderate")).toBe(true);
      expect(authorize("MODERATOR", "article.publish")).toBe(false);
      expect(authorize("MODERATOR", "article.review")).toBe(false);
      expect(authorize("MODERATOR", "article.view.all")).toBe(false);
    });

    it("reserves permanent deletion for ADMIN and OWNER", () => {
      // The list is asserted whole rather than per-role: that is what catches
      // a capability being added to EDITOR or AUTHOR by accident.
      const canDelete = ALL_ROLES.filter((r) => authorize(r, "article.delete"));
      expect(canDelete.sort()).toEqual(["ADMIN", "OWNER"]);
    });

    it("does not let an EDITOR adjudicate submissions", () => {
      // Editors publish their own work without an approval queue, but they do
      // not approve, reject or request changes on other people's submissions.
      expect(authorize("EDITOR", "article.review")).toBe(false);
      // What they keep: they can still ship anything.
      expect(authorize("EDITOR", "article.publish")).toBe(true);
      expect(authorize("EDITOR", "article.edit.any")).toBe(true);
    });

    it("reserves review decisions for REVIEWER, ADMIN and OWNER", () => {
      const canReview = ALL_ROLES.filter((r) => authorize(r, "article.review"));
      expect(canReview.sort()).toEqual(["ADMIN", "OWNER", "REVIEWER"]);
    });

    it("reserves publication settings for OWNER and ADMIN", () => {
      const canConfigure = ALL_ROLES.filter((r) =>
        authorize(r, "settings.publication")
      );
      expect(canConfigure.sort()).toEqual(["ADMIN", "OWNER"]);
    });
  });
});

describe("buildArticleScope", () => {
  const actor = (role: Role, authorId: string | null = "author-1") => ({
    id: "user-1",
    role,
    authorId,
  });

  it("returns an unfiltered scope for roles that see everything", () => {
    for (const role of ["OWNER", "ADMIN", "EDITOR"] as Role[]) {
      expect(buildArticleScope(actor(role)), role).toEqual({});
    }
  });

  it("blocks STAFF with an impossible condition rather than an empty filter", () => {
    // This is the important one. An empty object means "no filter", which in
    // Prisma means *every row* -- so a role that should see nothing would
    // instead see everything. The sentinel id is what prevents that.
    const scope = buildArticleScope(actor("STAFF"));
    expect(scope).toEqual({ id: "__access_denied__" });
    expect(scope).not.toEqual({});
  });

  it("limits an AUTHOR to their own work plus anything published", () => {
    expect(buildArticleScope(actor("AUTHOR", "author-7"))).toEqual({
      OR: [{ authorId: "author-7" }, { status: "PUBLISHED" }],
    });
  });

  it("does not let an author with no profile match other authors' rows", () => {
    // A null authorId must not become a wildcard. The sentinel keeps the
    // clause unsatisfiable instead of matching rows whose authorId is null.
    const scope = buildArticleScope(actor("AUTHOR", null)) as {
      OR: Array<Record<string, unknown>>;
    };
    expect(scope.OR[0]).toEqual({ authorId: "__none__" });
  });

  it("shows a REVIEWER the queue, published work and their own drafts", () => {
    const scope = buildArticleScope(actor("REVIEWER", "author-2")) as {
      OR: Array<Record<string, unknown>>;
    };
    expect(scope.OR).toEqual([
      { status: { in: ["SUBMITTED", "REVISION_REQUESTED", "APPROVED"] } },
      { status: "PUBLISHED" },
      { authorId: "author-2" },
    ]);
  });

  it("does not expose other people's drafts to a REVIEWER", () => {
    const scope = buildArticleScope(actor("REVIEWER", "author-2")) as {
      OR: Array<Record<string, unknown>>;
    };
    const serialised = JSON.stringify(scope.OR);
    expect(serialised).not.toContain("DRAFT");
  });

  it("limits a MODERATOR to published articles and their own", () => {
    expect(buildArticleScope(actor("MODERATOR", "author-3"))).toEqual({
      OR: [{ status: "PUBLISHED" }, { authorId: "author-3" }],
    });
  });

  it("never returns an unfiltered scope for a role lacking article.view.all", () => {
    // Guards the general shape of the rule rather than one role: any role
    // without the capability must carry some restriction.
    for (const role of ALL_ROLES.filter((r) => !authorize(r, "article.view.all"))) {
      expect(buildArticleScope(actor(role)), role).not.toEqual({});
    }
  });
});
