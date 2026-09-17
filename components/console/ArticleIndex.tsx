import Link from "next/link";
import Image from "next/image";
import { ArticleStatus, Role } from "@prisma/client";
import { authorize } from "@/lib/capabilities";
import StatusChip from "./StatusChip";
import { fmtViews } from "@/lib/utils";
import ArticleActionMenu from "../editorial/ArticleActionMenu";
import { Eye, ExternalLink, Edit3, FileText, Plus } from "lucide-react";

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

export default function ArticleIndex({
  articles,
  actor,
  emptyMessage = "No articles found.",
  emptyAction,
  isFiltered,
}: ArticleIndexProps) {
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{emptyAction.label}</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-surface border border-line rounded-xl shadow-xs mt-4">
      <table className="w-full border-collapse text-left text-sm" aria-label="Articles">
        <caption className="sr-only">Article list</caption>
        <thead>
          <tr className="border-b border-line bg-surface-2/60">
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
                className="hover:bg-surface-2/70 transition-colors"
              >
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
                    <Link
                      href={`/admin/editor/${a.id}`}
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

                      {/* Mobile status — rendered ONLY on mobile screens */}
                      <span className="md:hidden ml-auto">
                        <StatusChip status={a.status} />
                      </span>
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
                        href={`/${a.slug}`}
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
    </div>
  );
}
