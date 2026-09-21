import { describe, it, expect } from "vitest";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// The role model, stated once
// ─────────────────────────────────────────────────────────────────────────────
//
// A single table encoding the agreed newsroom roles. The per-role tests
// elsewhere check reasoning in detail; this exists so that widening any role is
// a visible, deliberate edit to a spec rather than a line buried in a capability
// set — which is how the EDITOR/edit.any drift happened in the first place.
//
//   OWNER     everything: review, approve/reject, publish directly, moderate
//             and delete comments, delete articles, edit anyone's profile
//   ADMIN     review, approve/reject, publish directly, moderate comments,
//             delete articles, edit anyone's profile
//   EDITOR    writes and publishes their OWN work directly. No approval queue,
//             no authority over other people's articles or profiles
//   AUTHOR    writes and submits for review
// ─────────────────────────────────────────────────────────────────────────────

type Expectation = Partial<Record<Role, boolean>>;

const MATRIX: Record<string, Expectation> = {
  // Creation is shared by everyone who writes.
  "article.create":          { OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: true },
  "article.submit":          { OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: true },

  // Adjudication. AUTHOR and EDITOR are out; EDITOR ships its own work instead.
  "article.review":          { OWNER: true,  ADMIN: true,  EDITOR: false, AUTHOR: false },

  // Publishing. EDITOR holds the verb; ownership is enforced separately in
  // validateTransition, because the capability alone cannot express "own only".
  "article.publish":         { OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: false },

  // Authority over other people's articles.
  "article.edit.any":        { OWNER: true,  ADMIN: true,  EDITOR: false, AUTHOR: false },
  "article.edit.own":        { OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: true },

  // Destruction.
  "article.delete":          { OWNER: true,  ADMIN: true,  EDITOR: false, AUTHOR: false },
  "article.delete.own.draft":{ OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: true },

  // Comments.
  "comment.moderate":        { OWNER: true,  ADMIN: true,  EDITOR: false, AUTHOR: false, MODERATOR: true },

  // Profiles and accounts.
  "author.manage.all":       { OWNER: true,  ADMIN: false, EDITOR: false, AUTHOR: false },
  "author.manage.own":       { OWNER: true,  ADMIN: true,  EDITOR: true,  AUTHOR: true },
  "user.manage":             { OWNER: true,  ADMIN: false,  EDITOR: false, AUTHOR: false },
};

describe("newsroom role matrix", () => {
  for (const [capability, expectations] of Object.entries(MATRIX)) {
    for (const [role, expected] of Object.entries(expectations)) {
      it(`${role} ${expected ? "has" : "does NOT have"} ${capability}`, () => {
        expect(authorize(role as Role, capability as never)).toBe(expected);
      });
    }
  }
});

describe("the distinctions that define each role", () => {
  it("EDITOR publishes but does not adjudicate", () => {
    expect(authorize("EDITOR", "article.publish")).toBe(true);
    expect(authorize("EDITOR", "article.review")).toBe(false);
  });

  it("EDITOR has no authority over other people's work", () => {
    for (const cap of ["article.edit.any", "author.manage.all", "comment.moderate", "article.delete"] as const) {
      expect(authorize("EDITOR", cap)).toBe(false);
    }
  });

  it("AUTHOR can start and submit work but never ship it", () => {
    expect(authorize("AUTHOR", "article.create")).toBe(true);
    expect(authorize("AUTHOR", "article.submit")).toBe(true);
    expect(authorize("AUTHOR", "article.publish")).toBe(false);
    expect(authorize("AUTHOR", "article.review")).toBe(false);
  });

  it("OWNER and ADMIN differ in no article capability", () => {
    // The two are deliberately equivalent for editorial work. If they ever
    // diverge it should be a considered change, not an accident.
    for (const cap of [
      "article.review", "article.publish", "article.edit.any",
      "article.delete", "comment.moderate",
    ] as const) {
      expect(authorize("OWNER", cap)).toBe(authorize("ADMIN", cap));
    }
  });
});
