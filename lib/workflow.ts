import { ArticleStatus } from "@prisma/client";
import { Capability, Actor, authorize } from "./capabilities";

// ──────────────────────────────────────────────────────────────────────────────
// Article Workflow — Transition Table (§40.2 of DASHBOARD spec)
// ──────────────────────────────────────────────────────────────────────────────
//
// This is the single source of truth for which status transitions are legal,
// which capability each requires, and what preconditions must hold.
//
// Every transition is its own server action (TASK-04, future phase).
// No transition is performed by writing a `status` field on a generic save.
// ──────────────────────────────────────────────────────────────────────────────

export interface TransitionDef {
  /** Target status */
  to: ArticleStatus;
  /** Server action name (for reference / lookup) */
  action: string;
  /** Required capability */
  capability: Capability;
  /** If true, the actor must own the article (authorId match) */
  requiresOwnership?: boolean;
  /** Human-readable label for the UI action button */
  label: string;
  /** Whether this is a destructive/dangerous action */
  destructive?: boolean;
}

/**
 * The complete transition table.
 * 
 * For each origin status, lists every legal destination with the capability
 * required and whether ownership is needed. Preconditions (title present,
 * reason length, etc.) are enforced in the individual server actions, not here.
 */
export const TRANSITIONS: Record<ArticleStatus, TransitionDef[]> = {
  DRAFT: [
    { to: "SUBMITTED",  action: "submitArticle",   capability: "article.submit",    requiresOwnership: true, label: "Submit for review" },
    { to: "PUBLISHED",  action: "publishArticle",  capability: "article.publish",   label: "Publish" },
    { to: "ARCHIVED",   action: "archiveArticle",  capability: "article.archive",   label: "Archive" },
  ],

  SUBMITTED: [
    { to: "PUBLISHED",          action: "publishArticle",   capability: "article.publish",   label: "Publish directly" },
    { to: "APPROVED",           action: "approveArticle",   capability: "article.review",    label: "Approve" },
    { to: "REVISION_REQUESTED", action: "requestChanges",   capability: "article.review",    label: "Request changes" },
    { to: "REJECTED",           action: "rejectArticle",    capability: "article.review",    label: "Reject", destructive: true },
    { to: "DRAFT",              action: "withdrawArticle",  capability: "article.submit",    requiresOwnership: true, label: "Withdraw" },
  ],

  // REVIEW is deprecated — treat identically to SUBMITTED for any legacy data
  REVIEW: [
    { to: "PUBLISHED",          action: "publishArticle",   capability: "article.publish",   label: "Publish directly" },
    { to: "APPROVED",           action: "approveArticle",   capability: "article.review",    label: "Approve" },
    { to: "REVISION_REQUESTED", action: "requestChanges",   capability: "article.review",    label: "Request changes" },
    { to: "REJECTED",           action: "rejectArticle",    capability: "article.review",    label: "Reject", destructive: true },
    { to: "DRAFT",              action: "withdrawArticle",  capability: "article.submit",    requiresOwnership: true, label: "Withdraw" },
  ],

  REVISION_REQUESTED: [
    { to: "PUBLISHED",          action: "publishArticle",   capability: "article.publish",   label: "Publish directly" },
    { to: "SUBMITTED",  action: "submitArticle",   capability: "article.submit",    requiresOwnership: true, label: "Resubmit" },
    { to: "ARCHIVED",   action: "archiveArticle",  capability: "article.archive",   label: "Archive" },
  ],

  APPROVED: [
    { to: "PUBLISHED",          action: "publishArticle",   capability: "article.publish",   label: "Publish" },
    { to: "SCHEDULED",          action: "scheduleArticle",  capability: "article.schedule",  label: "Schedule" },
    { to: "REVISION_REQUESTED", action: "requestChanges",   capability: "article.review",    label: "Request changes" },
  ],

  SCHEDULED: [
    { to: "PUBLISHED",  action: "publishScheduled", capability: "article.publish",  label: "Publish now" },
    { to: "APPROVED",   action: "cancelSchedule",   capability: "article.schedule", label: "Cancel schedule" },
  ],

  REJECTED: [
    { to: "DRAFT",  action: "reopenArticle",  capability: "article.edit.own", requiresOwnership: true, label: "Reopen as draft" },
  ],

  PUBLISHED: [
    { to: "DRAFT",     action: "unpublishArticle", capability: "article.unpublish", label: "Unpublish" },
    { to: "ARCHIVED",  action: "archiveArticle",   capability: "article.archive",   label: "Archive" },
  ],

  ARCHIVED: [
    { to: "DRAFT",  action: "restoreArticle", capability: "article.archive", label: "Restore as draft" },
  ],
};

// ──────────────────────────────────────────────────────────────────────────────
// getAllowedTransitions() — what can this actor do with this article right now?
// ──────────────────────────────────────────────────────────────────────────────

export interface ArticleForTransition {
  status: ArticleStatus;
  authorId: string | null;
}

/**
 * Returns the list of transitions available to the given actor on the given
 * article. Checks both capability and ownership requirements.
 */
export function getAllowedTransitions(
  article: ArticleForTransition,
  actor: Actor
): TransitionDef[] {
  const defs = TRANSITIONS[article.status] || [];
  
  return defs.filter((def) => {
    // Check capability
    if (!authorize(actor.role, def.capability)) return false;
    
    // Check ownership requirement
    if (def.requiresOwnership) {
      if (!actor.authorId || actor.authorId !== article.authorId) {
        // Editors+ with article.edit.any bypass ownership universally
        if (authorize(actor.role, "article.edit.any")) {
          return true;
        }
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Validates that a specific transition is legal for the given actor and article.
 * Returns an error message if the transition is illegal, or null if it's allowed.
 */
export function validateTransition(
  from: ArticleStatus,
  to: ArticleStatus,
  actor: Actor,
  article: ArticleForTransition
): string | null {
  const defs = TRANSITIONS[from] || [];
  const def = defs.find((d) => d.to === to);
  
  if (!def) {
    return `Transition from ${from} to ${to} is not allowed.`;
  }
  
  if (!authorize(actor.role, def.capability)) {
    return `You do not have the ${def.capability} capability required for this action.`;
  }
  
  if (def.requiresOwnership) {
    if (!actor.authorId || actor.authorId !== article.authorId) {
      if (!authorize(actor.role, "article.edit.any")) {
        return "This action requires article ownership.";
      }
    }
  }

  // Blanket ownership rule for anyone without newsroom-wide authority.
  //
  // Only three transitions carry requiresOwnership, which was sufficient while
  // every role holding article.publish also held article.edit.any. EDITOR no
  // longer does -- it may publish, but only its own work -- and without this an
  // editor could publish, archive or unpublish another author's article purely
  // because the capability check passed.
  //
  // Expressed as "no edit.any means own-content only" rather than as a flag on
  // each transition, so a transition added later is covered by default instead
  // of being open until someone remembers to mark it.
  //
  // Review decisions are exempt: judging a submission is precisely an act on
  // someone else's article, and it is gated by article.review, which EDITOR
  // does not hold.
  const isReviewDecision = def.capability === "article.review";
  if (!isReviewDecision && !authorize(actor.role, "article.edit.any")) {
    if (!actor.authorId || actor.authorId !== article.authorId) {
      return "You can only do this to your own articles.";
    }
  }

  return null; // transition is valid
}

// ──────────────────────────────────────────────────────────────────────────────
// Status metadata — for UI rendering (§41.5)
// ──────────────────────────────────────────────────────────────────────────────

export interface StatusMeta {
  label: string;
  token: string;
  shape: "hollow-circle" | "filled-circle" | "half-circle" | "check" | "clock" | "filled-square" | "cross" | "hollow-square";
}

export const STATUS_META: Record<ArticleStatus, StatusMeta> = {
  DRAFT:              { label: "DRAFT",              token: "--muted", shape: "hollow-circle" },
  SUBMITTED:          { label: "IN REVIEW",          token: "--warn",  shape: "filled-circle" },
  REVIEW:             { label: "IN REVIEW",          token: "--warn",  shape: "filled-circle" }, // deprecated alias
  REVISION_REQUESTED: { label: "CHANGES REQUESTED",  token: "--warn",  shape: "half-circle" },
  APPROVED:           { label: "APPROVED",           token: "--ok",    shape: "check" },
  SCHEDULED:          { label: "SCHEDULED",          token: "--ok",    shape: "clock" },
  PUBLISHED:          { label: "PUBLISHED",          token: "--ok",    shape: "filled-square" },
  REJECTED:           { label: "REJECTED",           token: "--bad",   shape: "cross" },
  ARCHIVED:           { label: "ARCHIVED",           token: "--faint", shape: "hollow-square" },
};

/**
 * Whether a status should be excluded from the default "active" view.
 * ARCHIVED articles are hidden unless the filter explicitly includes them.
 */
export function isTerminalStatus(status: ArticleStatus): boolean {
  return status === "ARCHIVED" || status === "REJECTED";
}
