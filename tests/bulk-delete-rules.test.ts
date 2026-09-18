import { describe, it, expect } from "vitest";
import { authorize } from "@/lib/capabilities";
import type { Role } from "@prisma/client";
import type { ArticleStatus } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Bulk delete eligibility
// ─────────────────────────────────────────────────────────────────────────────
//
// bulkDelete imports lib/db and cannot be unit-tested directly, so the decision
// it makes per article is modelled here. This is the destructive path, so the
// negative cases are the point: anything that lets a published article through,
// or lets a non-owner delete someone else's draft, is a data-loss bug.
// ─────────────────────────────────────────────────────────────────────────────

/** Mirrors the per-article branch inside bulkDelete. */
function canDelete(
  role: Role,
  status: ArticleStatus,
  isOwn: boolean
): { ok: boolean; reason?: string } {
  const canDeleteArchived = authorize(role, "article.delete");
  const canDeleteOwnDraft = authorize(role, "article.delete.own.draft");

  if (!canDeleteArchived && !canDeleteOwnDraft) return { ok: false, reason: "no capability" };

  if (status === "ARCHIVED") {
    return canDeleteArchived ? { ok: true } : { ok: false, reason: "cannot delete archived" };
  }
  if (status === "DRAFT") {
    if (canDeleteArchived) return { ok: true };
    return canDeleteOwnDraft && isOwn
      ? { ok: true }
      : { ok: false, reason: "not own draft" };
  }
  return { ok: false, reason: "wrong status" };
}

const DESTRUCTIVE_ROLES: Role[] = ["OWNER", "ADMIN"];

describe("only OWNER and ADMIN can delete archived articles", () => {
  it.each(DESTRUCTIVE_ROLES)("%s can", (r) => {
    expect(canDelete(r, "ARCHIVED", false).ok).toBe(true);
  });

  it.each(["EDITOR", "AUTHOR", "REVIEWER", "MODERATOR", "STAFF"] as Role[])(
    "%s cannot",
    (r) => {
      expect(canDelete(r, "ARCHIVED", false).ok).toBe(false);
    }
  );
});

describe("published articles are never bulk-deletable", () => {
  it.each(["OWNER", "ADMIN", "EDITOR", "AUTHOR"] as Role[])(
    "%s cannot delete a PUBLISHED article",
    (r) => {
      expect(canDelete(r, "PUBLISHED", true).ok).toBe(false);
    }
  );

  it("nor any other in-flight state", () => {
    for (const s of ["SUBMITTED", "APPROVED", "SCHEDULED", "REVISION_REQUESTED", "REJECTED"] as ArticleStatus[]) {
      expect(canDelete("OWNER", s, true).ok).toBe(false);
    }
  });
});

describe("draft ownership", () => {
  it("an author may delete their own draft", () => {
    expect(canDelete("AUTHOR", "DRAFT", true).ok).toBe(true);
  });

  it("an author may NOT delete someone else's draft", () => {
    expect(canDelete("AUTHOR", "DRAFT", false).ok).toBe(false);
  });

  it("an owner may clear out any draft", () => {
    expect(canDelete("OWNER", "DRAFT", false).ok).toBe(true);
  });

  it("an editor cannot delete drafts at all", () => {
    // EDITOR holds neither article.delete nor article.delete.own.draft in a
    // way that covers another person's work.
    expect(canDelete("EDITOR", "DRAFT", false).ok).toBe(false);
  });
});

describe("the capability set this depends on", () => {
  it("article.delete is held by exactly OWNER and ADMIN", () => {
    const holders = (["OWNER","ADMIN","EDITOR","AUTHOR","REVIEWER","MODERATOR","STAFF"] as Role[])
      .filter((r) => authorize(r, "article.delete"));
    expect(holders.sort()).toEqual(["ADMIN", "OWNER"]);
  });
});
