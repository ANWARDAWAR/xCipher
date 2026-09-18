"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Role } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// AdminNavLinks — capability-driven navigation
//
// Changes from original:
//   • "Drafts" removed (handled by /admin/articles?status=DRAFT,REVISION_REQUESTED)
//   • "Review Queue" links to /admin/articles?status=SUBMITTED
//   • Taxonomy uses canViewTaxonomy (not canReview — fixes the REVIEWER dead link)
//   • Active state uses prefix matching (not exact equality)
//   • Editor route (/admin/editor/[id]) keeps the "New Story" item active
// ──────────────────────────────────────────────────────────────────────────────

interface AdminNavLinksProps {
  userRole: Role;
  canReview: boolean;
  canManageUsers: boolean;
  canViewLogs: boolean;
  canModerateComments: boolean;
  canViewSubscribers: boolean;
  canViewTaxonomy: boolean;
  canManageAuthors: boolean;
  reviewCount?: number;
}

export default function AdminNavLinks({
  userRole,
  canReview,
  canManageUsers,
  canViewLogs,
  canModerateComments,
  canViewSubscribers,
  canViewTaxonomy,
  canManageAuthors,
  reviewCount = 0,
}: AdminNavLinksProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active state: prefix match with special cases
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  // Special case: /admin/articles with status=SUBMITTED acts as the review queue
  const isReviewQueue =
    pathname === "/admin/articles" &&
    searchParams.get("status") === "SUBMITTED";

  /**
   * Active state was communicated by a CSS class alone, which is colour-only:
   * a screen reader announced every item identically, so "which section am I
   * in" was unanswerable without sight. aria-current="page" is the property
   * assistive tech actually reads for this, and it costs nothing visually.
   */
  const navProps = (active: boolean) => ({
    className: active ? "on" : "",
    "aria-current": active ? ("page" as const) : undefined,
  });

  return (
    <>
      <Link href="/admin" {...navProps(isActive("/admin", true))}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        Dashboard
      </Link>

      <div className="cs-nav-group">Content</div>

      <Link
        href="/admin/articles"
        {...navProps(isActive("/admin/articles") && !isReviewQueue)}
      >
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4z" />
          <path d="M18 8h2a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H7" />
          <path d="M8.5 8h6M8.5 12h6M8.5 16h4" />
        </svg>
        {userRole === "AUTHOR" ? "My Articles" : "Articles"}
      </Link>

      {canReview && (
        <Link
          href="/admin/articles?status=SUBMITTED"
          {...navProps(isReviewQueue)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Review Queue
          </span>
          {reviewCount > 0 && (
            <span style={{
              background: "var(--accent)",
              color: "white",
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "10px",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {reviewCount}
            </span>
          )}
        </Link>
      )}

      <Link href="/admin/editor" {...navProps(isActive("/admin/editor"))}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        New Story
      </Link>

      {(canViewTaxonomy || canManageAuthors) && (
        <div className="cs-nav-group">Newsroom</div>
      )}

      {canManageAuthors && (
        <Link href="/admin/authors" {...navProps(isActive("/admin/authors"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Authors
        </Link>
      )}

      {canViewTaxonomy && (
        <Link href="/admin/taxonomy" {...navProps(isActive("/admin/taxonomy"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          Taxonomy
        </Link>
      )}

      {(canManageUsers || canViewLogs) && (
        <div className="cs-nav-group">Administration</div>
      )}

      {canManageUsers && (
        <Link href="/admin/users" {...navProps(isActive("/admin/users"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          Users
        </Link>
      )}

      {canModerateComments && (
        <Link href="/admin/comments" {...navProps(isActive("/admin/comments"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          Comments
        </Link>
      )}

      {canViewSubscribers && (
        <Link href="/admin/subscribers" {...navProps(isActive("/admin/subscribers"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Subscribers
        </Link>
      )}

      {canViewLogs && (
        <Link href="/admin/audit-logs" {...navProps(isActive("/admin/audit-logs"))}>
          <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Audit Logs
        </Link>
      )}

      <div className="cs-nav-group">You</div>

      <Link href="/admin/settings" {...navProps(isActive("/admin/settings"))}>
        <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.4 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.4-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.2-1.2z" />
        </svg>
        Settings
      </Link>
    </>
  );
}
