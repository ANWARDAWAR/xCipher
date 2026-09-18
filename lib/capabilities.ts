import { Role } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// Capability — the single source of truth for authorization
// ──────────────────────────────────────────────────────────────────────────────
//
// Every authorization check in the application must resolve through this map.
// No server action, page guard, or navigation condition may compare role strings
// directly — use `authorize(role, capability)` instead.
//
// The numeric ROLE_HIERARCHY survives ONLY inside `canManageUser` / `canAssignRole`
// in lib/permissions.ts — nowhere else.
// ──────────────────────────────────────────────────────────────────────────────

export type Capability =
  // Console access
  | "console.access"
  // Article viewing
  | "article.view.all"
  | "article.view.own"
  | "article.view.published"
  // Article authoring
  | "article.create"
  | "article.edit.own"
  | "article.edit.any"
  | "article.submit"
  // Article review
  | "article.review"
  // Article publishing lifecycle
  | "article.publish"
  | "article.schedule"
  | "article.unpublish"
  | "article.archive"
  // Article deletion
  | "article.delete"
  | "article.delete.own.draft"
  // Article featuring
  | "article.feature"
  // Taxonomy
  | "taxonomy.create"
  | "taxonomy.rename"
  | "taxonomy.delete"
  | "taxonomy.merge"
  // Author management
  | "author.manage.all"
  | "author.manage.own"
  // Comment moderation
  | "comment.moderate"
  // User management
  | "user.view"
  | "user.manage"
  | "user.invite"
  // Subscribers
  | "subscriber.view"
  // Audit
  | "audit.view"
  | "audit.export"
  // Settings
  | "settings.publication"
  | "settings.personal";

// ──────────────────────────────────────────────────────────────────────────────
// Role → Capability mapping  (§39.2 of the DASHBOARD spec)
// ──────────────────────────────────────────────────────────────────────────────

const OWNER_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.all", "article.view.own", "article.view.published",
  "article.create", "article.edit.own", "article.edit.any",
  "article.submit", "article.review",
  "article.publish", "article.schedule", "article.unpublish", "article.archive",
  // "article.delete" was previously withheld here, on the reasoning that an
  // account which can grant itself any role should not also be able to erase
  // the archive. That restriction was reversed by explicit product decision:
  // the owner is accountable for the publication and needs takedown authority
  // without first escalating to another account.
  //
  // The mitigation is the audit trail rather than the permission boundary --
  // deleteArticlePermanently writes an AuditLog entry naming the actor, the
  // article and the time, and that record survives the deletion. Note the
  // limit of that: an owner can also grant themselves audit.export and has
  // database access in practice, so this deters and documents rather than
  // prevents.
  "article.delete",
  "article.delete.own.draft", "article.feature",
  "taxonomy.create", "taxonomy.rename", "taxonomy.delete", "taxonomy.merge",
  "author.manage.all", "author.manage.own",
  "comment.moderate",
  "user.view", "user.manage", "user.invite",
  "subscriber.view",
  "audit.view", "audit.export",
  "settings.publication", "settings.personal",
]);

const ADMIN_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.all", "article.view.own", "article.view.published",
  "article.create", "article.edit.own", "article.edit.any",
  "article.submit", "article.review",
  "article.publish", "article.schedule", "article.unpublish", "article.archive",
  "article.delete", "article.delete.own.draft", "article.feature",
  "taxonomy.create", "taxonomy.rename", "taxonomy.delete", "taxonomy.merge",
  "author.manage.all", "author.manage.own",
  "comment.moderate",
  "user.view", "user.manage", "user.invite",
  "subscriber.view",
  "audit.view", "audit.export",
  "settings.publication", "settings.personal",
]);

const EDITOR_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.all", "article.view.own", "article.view.published",
  "article.create", "article.edit.own", "article.edit.any",
  // No "article.review". An editor ships their own work directly -- they hold
  // article.publish and need no approval queue -- but they do not adjudicate
  // other people's submissions. Approve/reject/request-changes is a separate
  // duty held by REVIEWER, ADMIN and OWNER.
  //
  // Consequence: EDITOR no longer sees the review queue or the decision
  // actions on a submitted article. They can still open, edit and publish any
  // article, so nothing they could previously ship becomes unreachable.
  "article.submit",
  "article.publish", "article.schedule", "article.unpublish", "article.archive",
  "article.delete.own.draft", "article.feature",
  "taxonomy.create", "taxonomy.rename",
  "author.manage.all", "author.manage.own",
  "comment.moderate",
  "subscriber.view",
  "settings.personal",
]);

const MODERATOR_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.own", "article.view.published",
  "comment.moderate",
  "author.manage.own",
  "settings.personal",
]);

const REVIEWER_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.all", "article.view.own", "article.view.published",
  "article.review",
  "author.manage.own",
  "settings.personal",
]);

const AUTHOR_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  "console.access",
  "article.view.own", "article.view.published",
  "article.create",
  "article.edit.own",
  "article.submit",
  "article.delete.own.draft",
  "author.manage.own",
  "settings.personal",
]);

const STAFF_CAPS: ReadonlySet<Capability> = new Set<Capability>([
  // STAFF has no console access — they're public-site-only accounts
  "article.view.own", "article.view.published",
  "author.manage.own",
  "settings.personal",
]);

export const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  OWNER: OWNER_CAPS,
  ADMIN: ADMIN_CAPS,
  EDITOR: EDITOR_CAPS,
  MODERATOR: MODERATOR_CAPS,
  REVIEWER: REVIEWER_CAPS,
  AUTHOR: AUTHOR_CAPS,
  STAFF: STAFF_CAPS,
};

// ──────────────────────────────────────────────────────────────────────────────
// authorize() — the primary capability check
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns `true` if the given role has the specified capability.
 * This is the only function that should be used for capability checks.
 */
export function authorize(role: Role, capability: Capability): boolean {
  const caps = ROLE_CAPABILITIES[role];
  if (!caps) return false;
  return caps.has(capability);
}

// ──────────────────────────────────────────────────────────────────────────────
// Actor — the resolved identity used for scoping and authorization
// ──────────────────────────────────────────────────────────────────────────────

export interface Actor {
  id: string;
  role: Role;
  authorId: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// buildArticleScope() — the ONLY source of article query scoping
// ──────────────────────────────────────────────────────────────────────────────
//
// Every article query in the console MUST use this function to derive its
// `where` clause. No ad-hoc `role === "AUTHOR"` checks.
//
// Scope per role (§39.2):
//   OWNER, ADMIN, EDITOR → every article in every status
//   REVIEWER             → every article in review + all published + own
//   MODERATOR            → published only + own
//   AUTHOR               → own in every status + all published
//   STAFF                → no console access (returns impossible filter)
// ──────────────────────────────────────────────────────────────────────────────

export function buildArticleScope(actor: Actor): Record<string, unknown> {
  const role = actor.role;

  // Full access roles — no scoping needed
  if (authorize(role, "article.view.all")) {
    // OWNER, ADMIN, EDITOR: see everything
    // REVIEWER: see everything in review + published + own
    if (role === "REVIEWER") {
      return {
        OR: [
          { status: { in: ["SUBMITTED", "REVISION_REQUESTED", "APPROVED"] } },
          { status: "PUBLISHED" },
          { authorId: actor.authorId || "__none__" },
        ],
      };
    }
    // OWNER, ADMIN, EDITOR: no filter
    return {};
  }

  // MODERATOR: published + own
  if (role === "MODERATOR") {
    return {
      OR: [
        { status: "PUBLISHED" },
        { authorId: actor.authorId || "__none__" },
      ],
    };
  }

  // AUTHOR: own in every status + all published
  if (role === "AUTHOR") {
    return {
      OR: [
        { authorId: actor.authorId || "__none__" },
        { status: "PUBLISHED" },
      ],
    };
  }

  // STAFF or unknown: no articles visible in the console
  // Return an impossible condition rather than an empty filter
  return { id: "__access_denied__" };
}

// ──────────────────────────────────────────────────────────────────────────────
// Article list field projection — what to SELECT for list views
// ──────────────────────────────────────────────────────────────────────────────
//
// Never select contentHtml or contentJson in list queries.
// ──────────────────────────────────────────────────────────────────────────────

export const ARTICLE_LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  deck: true,
  img: true,
  status: true,
  featured: true,
  views: true,
  author: true,     // legacy string fallback
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  scheduledFor: true,
  // Relations — selected fields only
  authorModel: {
    select: {
      id: true,
      name: true,
      slug: true,
      avatar: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
    },
    take: 3,
  },
  _count: {
    select: {
      revisions: true,
      comments: true,
    },
  },
} as const;
