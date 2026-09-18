import { describe, it, expect } from "vitest";
import type { Role, ArticleStatus } from "@prisma/client";
import {
  TRANSITIONS,
  validateTransition,
  getAllowedTransitions,
  isTerminalStatus,
} from "@/lib/workflow";

/**
 * Tests for the article state machine.
 *
 * validateTransition is the single choke point every workflow action passes
 * through, so a hole here is a hole in all seventeen of them. It is also pure,
 * which makes exhaustive testing cheap.
 */

const actor = (role: Role, authorId: string | null = "author-1") => ({
  id: "user-1",
  role,
  authorId,
});

const article = (authorId: string | null = "author-1") => ({
  id: "article-1",
  status: "DRAFT" as ArticleStatus,
  authorId,
});

describe("validateTransition", () => {
  it("rejects a transition that is not in the table at all", () => {
    // PUBLISHED -> SUBMITTED is not a defined edge. Even an owner cannot do it:
    // the table is the authority, not the role.
    const err = validateTransition("PUBLISHED", "SUBMITTED", actor("OWNER"), article());
    expect(err).toMatch(/not allowed/i);
  });

  it("rejects a transition to the same status", () => {
    expect(validateTransition("DRAFT", "DRAFT", actor("OWNER"), article())).toMatch(
      /not allowed/i
    );
  });

  it("allows an owner to publish a draft", () => {
    expect(validateTransition("DRAFT", "PUBLISHED", actor("OWNER"), article())).toBeNull();
  });

  it("refuses to let an author publish their own draft", () => {
    // The capability check, not ownership, is what stops this.
    const err = validateTransition("DRAFT", "PUBLISHED", actor("AUTHOR"), article());
    expect(err).toMatch(/article\.publish/);
  });

  it("refuses to let a reviewer publish an approved article", () => {
    const err = validateTransition("APPROVED", "PUBLISHED", actor("REVIEWER"), article());
    expect(err).toMatch(/article\.publish/);
  });

  describe("ownership", () => {
    it("lets an author submit their own draft", () => {
      const a = actor("AUTHOR", "author-1");
      expect(validateTransition("DRAFT", "SUBMITTED", a, article("author-1"))).toBeNull();
    });

    it("stops an author submitting someone else's draft", () => {
      const a = actor("AUTHOR", "author-1");
      const err = validateTransition("DRAFT", "SUBMITTED", a, article("author-2"));
      expect(err).toMatch(/ownership/i);
    });

    it("stops an author with no profile submitting an unowned draft", () => {
      // authorId null on both sides must not be treated as a match.
      const a = actor("AUTHOR", null);
      const err = validateTransition("DRAFT", "SUBMITTED", a, article(null));
      expect(err).toMatch(/ownership/i);
    });

    it("lets an editor submit an article they do not own", () => {
      // Deliberate exception in validateTransition: article.edit.any overrides
      // the ownership requirement for submission specifically, so an editor can
      // move someone else's draft along.
      const a = actor("EDITOR", "author-9");
      expect(validateTransition("DRAFT", "SUBMITTED", a, article("author-1"))).toBeNull();
    });

    it("does not extend that exception to withdrawal by a non-owner author", () => {
      const a = actor("AUTHOR", "author-5");
      const err = validateTransition("SUBMITTED", "DRAFT", a, article("author-1"));
      expect(err).toMatch(/ownership/i);
    });
  });

  describe("review decisions", () => {
    for (const to of ["APPROVED", "REVISION_REQUESTED", "REJECTED"] as ArticleStatus[]) {
      it(`lets a reviewer move SUBMITTED -> ${to}`, () => {
        expect(
          validateTransition("SUBMITTED", to, actor("REVIEWER"), article("author-2"))
        ).toBeNull();
      });

      it(`stops an author moving SUBMITTED -> ${to}`, () => {
        const err = validateTransition("SUBMITTED", to, actor("AUTHOR"), article());
        expect(err).toMatch(/article\.review/);
      });

      it(`stops a moderator moving SUBMITTED -> ${to}`, () => {
        const err = validateTransition("SUBMITTED", to, actor("MODERATOR"), article());
        expect(err).toMatch(/article\.review/);
      });
    }
  });

  describe("deprecated REVIEW status", () => {
    it("behaves exactly like SUBMITTED for legacy rows", () => {
      // No row should hold REVIEW after the backfill migration, but the enum
      // value still exists, so the table must not strand anything that does.
      const fromReview = TRANSITIONS.REVIEW.map((t) => t.to).sort();
      const fromSubmitted = TRANSITIONS.SUBMITTED.map((t) => t.to).sort();
      expect(fromReview).toEqual(fromSubmitted);
    });
  });

  describe("archive and restore", () => {
    it("lets an owner archive a published article", () => {
      expect(
        validateTransition("PUBLISHED", "ARCHIVED", actor("OWNER"), article())
      ).toBeNull();
    });

    it("stops an author archiving anything, even their own", () => {
      const err = validateTransition("PUBLISHED", "ARCHIVED", actor("AUTHOR"), article());
      expect(err).toMatch(/article\.archive/);
    });

    it("only allows an archived article back to DRAFT", () => {
      expect(TRANSITIONS.ARCHIVED.map((t) => t.to)).toEqual(["DRAFT"]);
    });
  });
});

describe("TRANSITIONS table integrity", () => {
  it("has an entry for every status", () => {
    const statuses: ArticleStatus[] = [
      "DRAFT",
      "REVIEW",
      "PUBLISHED",
      "SUBMITTED",
      "REVISION_REQUESTED",
      "REJECTED",
      "APPROVED",
      "SCHEDULED",
      "ARCHIVED",
    ];
    for (const s of statuses) {
      expect(TRANSITIONS[s], `missing transitions for ${s}`).toBeDefined();
    }
  });

  it("never defines a transition to the same status", () => {
    for (const [from, defs] of Object.entries(TRANSITIONS)) {
      for (const def of defs) {
        expect(def.to, `${from} -> itself`).not.toBe(from);
      }
    }
  });

  it("never defines the same target twice from one status", () => {
    // A duplicate edge means find() silently picks the first and the second is
    // dead -- including, potentially, a stricter capability that never applies.
    for (const [from, defs] of Object.entries(TRANSITIONS)) {
      const targets = defs.map((d) => d.to);
      expect(new Set(targets).size, `duplicate target from ${from}`).toBe(targets.length);
    }
  });

  it("gives every transition a capability", () => {
    for (const [from, defs] of Object.entries(TRANSITIONS)) {
      for (const def of defs) {
        expect(def.capability, `${from} -> ${def.to} has no capability`).toBeTruthy();
      }
    }
  });
});

describe("getAllowedTransitions", () => {
  it("offers an author nothing on someone else's published article", () => {
    const allowed = getAllowedTransitions(
      { ...article("author-2"), status: "PUBLISHED" },
      actor("AUTHOR", "author-1")
    );
    expect(allowed).toEqual([]);
  });

  it("offers an author only submission on their own draft", () => {
    const allowed = getAllowedTransitions(
      { ...article("author-1"), status: "DRAFT" },
      actor("AUTHOR", "author-1")
    );
    expect(allowed.map((t) => t.to)).toEqual(["SUBMITTED"]);
  });

  it("agrees with validateTransition for every role and status", () => {
    // The UI renders getAllowedTransitions; the server enforces
    // validateTransition. If they ever disagree, the console shows a button
    // that fails on click, or hides an action the user is entitled to.
    const roles: Role[] = [
      "OWNER",
      "ADMIN",
      "EDITOR",
      "AUTHOR",
      "REVIEWER",
      "MODERATOR",
      "STAFF",
    ];
    const target = article("author-1");

    for (const role of roles) {
      for (const from of Object.keys(TRANSITIONS) as ArticleStatus[]) {
        const a = actor(role, "author-1");
        const offered = getAllowedTransitions({ ...target, status: from }, a).map(
          (t) => t.to
        );
        for (const def of TRANSITIONS[from]) {
          const permitted = validateTransition(from, def.to, a, target) === null;
          expect(
            offered.includes(def.to),
            `${role}: ${from} -> ${def.to} offered=${offered.includes(def.to)} permitted=${permitted}`
          ).toBe(permitted);
        }
      }
    }
  });
});

describe("isTerminalStatus", () => {
  it("treats ARCHIVED and REJECTED as terminal and nothing else", () => {
    const terminal = (Object.keys(TRANSITIONS) as ArticleStatus[]).filter(
      isTerminalStatus
    );
    expect(terminal.sort()).toEqual(["ARCHIVED", "REJECTED"]);
  });

  it("is about editorial finality, not the absence of transitions", () => {
    // Worth pinning down because it looks like a bug at first glance: both
    // terminal statuses still have an outgoing edge (ARCHIVED -> DRAFT to
    // restore, REJECTED -> DRAFT to reopen). "Terminal" here means the article
    // has left the pipeline and only an explicit revival brings it back -- it
    // does not mean the state machine is stuck.
    expect(TRANSITIONS.REJECTED.length).toBeGreaterThan(0);
    expect(TRANSITIONS.ARCHIVED.length).toBeGreaterThan(0);
    expect(isTerminalStatus("REJECTED")).toBe(true);
    expect(isTerminalStatus("DRAFT")).toBe(false);
  });
});
