"use client";

// Client-side because bulk selection needs state. Nothing server-only is
// imported here -- no db, no auth; authorize() is a pure function over a static
// capability map, and the map is not a secret: it describes which role may do
// what, and every one of those checks is re-run on the server before anything
// is written. Hiding a control the server would refuse anyway buys nothing.

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArticleStatus, Role } from "@prisma/client";
import { authorize } from "@/lib/capabilities";
import StatusChip from "./StatusChip";
import { fmtViews } from "@/lib/utils";
import ArticleActionMenu from "../editorial/ArticleActionMenu";
import { Eye, ExternalLink, Edit3, FileText, Plus, Clock } from "lucide-react";
import BulkActionBar from "./BulkActionBar";

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  deck: string | null;
  img: string | null;
  status: ArticleStatus;
  featured: boolean;
  views: number;
  authorId?: string | null;
  author: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  publishedAt: Date | string | null;
  scheduledFor: Date | string | null;
  authorModel: {
    id: string;
    name: string;
    slug: string;
    avatar: string | null;
  } | null;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  tags: { id: string; name: string }[];
  _count?: {
    revisions: number;
    comments: number;
  };
}

interface ArticleIndexProps {
  articles: ArticleRow[];
  actor: { id: string; role: Role; authorId: string | null };
  emptyMessage?: string;
  emptyAction?: {
    label: string;
    href: string;
  };
  isFiltered?: boolean;
}

function relativeTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Absolute date for scheduled/published times, where "in 3 days" is not enough. */
function absoluteDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function ArticleIndex({
  articles,
  actor,
  emptyMessage = "No articles found.",
  emptyAction,
  isFiltered,
}: ArticleIndexProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Which bulk verbs to offer at all. These mirror the capabilities the server
  // actions enforce; per-article eligibility is still decided there, so an
  // article in the wrong state is skipped and reported rather than hidden.
  const bulkCaps = useMemo(
    () => ({
      canArchive: authorize(actor.role, "article.archive"),
      canPublish: authorize(actor.role, "article.publish"),
      canSubmit: authorize(actor.role, "article.submit"),
    }),
    [actor.role]
  );
  const anyBulk = bulkCaps.canArchive || bulkCaps.canPublish || bulkCaps.canSubmit;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select-all covers the current page only. It deliberately does not reach
  // across pagination: "select all 4,000 matching" is a different and much more
  // dangerous operation, and conflating the two is how people archive an
  // archive they never saw.
  const allOnPageSelected =
    articles.length > 0 && articles.every((a) => selected.has(a.id));

  const toggleAll = () => {
    setSelected((prev) =>
      allOnPageSelected ? new Set() : new Set([...prev, ...articles.map((a) => a.id)])
    );
  };

  if (articles.length === 0) {
    return (
      <div className="bg-surface border border-line rounded-xl p-12 text-center mt-4">
        <FileText className="w-10 h-10 text-faint mx-auto mb-3" />
        <p className="text-sm text-muted font-medium mb-4">
          {isFiltered
            ? "No articles match these filters."
            : emptyMessage || "No articles yet."}
        </p>
        {!isFiltered && emptyAction && (
          <Link 
            href={emptyAction.href} 
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-deep text-on-accent text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{emptyAction.label}</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
    {anyBulk && (
      // Mobile has no table header to hang select-all off, so it gets its own
      // row above the list rather than losing the affordance entirely.
      <div className="md:hidden flex items-center gap-2 mt-4 px-1">
        <input
          id="select-all-mobile"
          type="checkbox"
          checked={allOnPageSelected}
          onChange={toggleAll}
          className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
        />
        <label htmlFor="select-all-mobile" className="text-xs font-semibold text-muted">
          Select all on this page
        </label>
      </div>
    )}
    <div className="bg-surface border border-line rounded-xl shadow-xs mt-4 overflow-hidden">
      {/* Table from md up. Below that the same data renders as stacked rows:
          a five-column table on a 375px screen forces horizontal scrolling,
          which hides the actions column exactly where it is hardest to find. */}
      <table className="w-full border-collapse text-left text-sm hidden md:table" aria-label="Articles">
        <caption className="sr-only">Article list</caption>
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
            {anyBulk && (
              <th className="py-3 pl-4 pr-0 w-10">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  className="w-4 h-4 accent-[var(--accent)] cursor-pointer align-middle"
                  aria-label={
                    allOnPageSelected
                      ? "Deselect all articles on this page"
                      : "Select all articles on this page"
                  }
                />
              </th>
            )}
            <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-muted w-24">
              <span className="sr-only">Thumbnail</span>
            </th>
            <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-muted">
              Article
            </th>
            <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-muted w-36 hidden md:table-cell">
              Status
            </th>
            <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-muted w-28 text-right hidden lg:table-cell">
              Views
            </th>
            <th className="py-3 px-4 font-semibold text-[11px] tracking-wider uppercase text-muted w-28 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {articles.map((a) => {
            const authorName = a.authorModel?.name || a.author || "Unknown";
            const categoryName = a.category?.name || "";

            return (
              <tr
                key={a.id}
                className={`transition-colors ${
                  selected.has(a.id) ? "bg-accent/5" : "hover:bg-surface-2/70"
                }`}
              >
                {anyBulk && (
                  <td className="py-3.5 pl-4 pr-0 align-middle w-10">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="w-4 h-4 accent-[var(--accent)] cursor-pointer align-middle"
                      aria-label={`Select "${a.title || "Untitled article"}"`}
                    />
                  </td>
                )}
                {/* Thumbnail */}
                <td className="p-3.5 align-middle w-24">
                  {a.img ? (
                    <div className="w-20 h-12 rounded-lg overflow-hidden border border-line bg-surface-2 shrink-0 relative">
                      <Image
                        src={a.img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-12 rounded-lg border border-line bg-surface-2 flex items-center justify-center font-bold text-base text-muted shrink-0">
                      {(a.title || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                </td>

                {/* Primary — title + metadata */}
                <td className="p-3.5 align-middle">
                  <div className="min-w-0 max-w-xl">
                    {/* The headline opens the read-only detail hub, not the
                        editor. Clicking a title to inspect something should not
                        drop the actor into an editing surface -- and a reviewer
                        holding article.view.all without any edit right could not
                        follow the old link at all. The pencil below still goes
                        straight to the editor. */}
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="text-sm font-semibold text-ink hover:text-accent transition-colors line-clamp-2 block leading-snug"
                    >
                      {a.title || "Untitled article"}
                    </Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-muted">
                      <span className="font-medium text-ink-2">{authorName}</span>
                      {categoryName && (
                        <>
                          <span className="text-faint">·</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-2 border border-line text-[11px] font-medium text-ink-2">
                            {categoryName}
                          </span>
                        </>
                      )}
                      <span className="text-faint">·</span>
                      <span className="text-[11px]">{relativeTime(a.updatedAt)}</span>

                      {/* A scheduled article's whole point is the date it goes
                          live, and "in 3 days" is not precise enough to trust a
                          publication slot to. Shown absolute, and only for the
                          one status where it matters. */}
                      {a.status === "SCHEDULED" && a.scheduledFor && (
                        <>
                          <span className="text-faint">·</span>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warn">
                            <Clock className="w-3 h-3" aria-hidden="true" />
                            <span>Goes live {absoluteDateTime(a.scheduledFor)}</span>
                          </span>
                        </>
                      )}

                    </div>
                  </div>
                </td>

                {/* Status — dedicated column on tablet and desktop */}
                <td className="p-3.5 align-middle hidden md:table-cell w-36">
                  <StatusChip status={a.status} />
                </td>

                {/* Views metric */}
                <td className="p-3.5 align-middle text-right hidden lg:table-cell w-28">
                  {a.status === "PUBLISHED" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-2 border border-line text-xs font-semibold text-ink tabular-nums">
                      <Eye className="w-3.5 h-3.5 text-muted" />
                      <span>{fmtViews(a.views || 0)}</span>
                    </span>
                  ) : (
                    <span className="text-muted text-xs">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3.5 align-middle text-right w-28">
                  <div className="flex items-center justify-end gap-1.5">
                    {a.status === "PUBLISHED" && (
                      <Link
                        className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 border border-transparent hover:border-line transition-colors"
                        href={`/article/${a.slug}`}
                        target="_blank"
                        title="View on site"
                        aria-label={`View "${a.title}" on site`}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      href={`/admin/editor/${a.id}`}
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 border border-transparent hover:border-line transition-colors"
                      title={a.status === "PUBLISHED" ? "Edit article" : "Open editor"}
                      aria-label={`Edit "${a.title}"`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    <ArticleActionMenu 
                      id={a.id} 
                      title={a.title} 
                      status={a.status}
                      canArchive={authorize(actor.role, "article.archive")}
                      canDeletePermanently={authorize(actor.role, "article.delete")}
                      canDeleteOwnDraft={authorize(actor.role, "article.delete.own.draft") && a.authorId === actor.authorId}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ── Stacked rows, below md ──────────────────────────────────────────
          Same data, same actions, no horizontal scroll. Thumbnail and title sit
          on one line; status and metadata wrap beneath. */}
      <ul className="md:hidden divide-y divide-line">
        {articles.map((a) => {
          const authorName = a.authorModel?.name || a.author || "Unknown";
          const categoryName = a.category?.name || "";

          return (
            <li
              key={a.id}
              className={`p-3.5 ${selected.has(a.id) ? "bg-accent/5" : ""}`}
            >
              <div className="flex gap-3">
                {anyBulk && (
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggle(a.id)}
                    className="w-4 h-4 mt-0.5 accent-[var(--accent)] cursor-pointer shrink-0"
                    aria-label={`Select "${a.title || "Untitled article"}"`}
                  />
                )}
                {a.img ? (
                  <div className="w-16 h-11 rounded-lg overflow-hidden border border-line bg-surface-2 shrink-0 relative">
                    <Image src={a.img} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="w-16 h-11 rounded-lg border border-line bg-surface-2 flex items-center justify-center font-bold text-sm text-muted shrink-0">
                    {(a.title || "?").charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/articles/${a.id}`}
                    className="text-sm font-semibold text-ink hover:text-accent transition-colors line-clamp-2 block leading-snug"
                  >
                    {a.title || "Untitled article"}
                  </Link>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted">
                    <StatusChip status={a.status} />
                    <span className="font-medium text-ink-2">{authorName}</span>
                    {categoryName && (
                      <>
                        <span className="text-faint">·</span>
                        <span className="text-[11px]">{categoryName}</span>
                      </>
                    )}
                    <span className="text-faint">·</span>
                    <span className="text-[11px]">{relativeTime(a.updatedAt)}</span>
                    {a.status === "PUBLISHED" && (
                      <>
                        <span className="text-faint">·</span>
                        <span className="inline-flex items-center gap-1 text-[11px] tabular-nums">
                          <Eye className="w-3 h-3" aria-hidden="true" />
                          {fmtViews(a.views || 0)}
                        </span>
                      </>
                    )}
                  </div>

                  {a.status === "SCHEDULED" && a.scheduledFor && (
                    <div className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium text-warn">
                      <Clock className="w-3 h-3" aria-hidden="true" />
                      <span>Goes live {absoluteDateTime(a.scheduledFor)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-1 shrink-0">
                  {a.status === "PUBLISHED" && (
                    <Link
                      className="p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-3 border border-transparent hover:border-line transition-colors"
                      href={`/article/${a.slug}`}
                      target="_blank"
                      aria-label={`View "${a.title}" on site`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  <ArticleActionMenu
                    id={a.id}
                    title={a.title}
                    status={a.status}
                    canArchive={authorize(actor.role, "article.archive")}
                    canDeletePermanently={authorize(actor.role, "article.delete")}
                    canDeleteOwnDraft={
                      authorize(actor.role, "article.delete.own.draft") && a.authorId === actor.authorId
                    }
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>

    <BulkActionBar
      selectedIds={[...selected]}
      onClear={() => setSelected(new Set())}
      canArchive={bulkCaps.canArchive}
      canPublish={bulkCaps.canPublish}
      canSubmit={bulkCaps.canSubmit}
    />
    </>
  );
}
