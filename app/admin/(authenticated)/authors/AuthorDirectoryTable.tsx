"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Search, BadgeCheck, UserX } from "lucide-react";

interface AuthorRow {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  avatar: string | null;
  headline: string | null;
  email: string | null;
  verifiedTitle: boolean;
  joinedAt: string;
  totalArticles: number;
  publishedArticles: number;
  totalViews: number;
  linkedUserEmail: string | null;
  linkedUserRole: string | null;
  /** Null when the author has no linked account; no Edit action is shown. */
  linkedUserId: string | null;
}

/**
 * Client-side filtering is the right call *here* specifically.
 *
 * The standing rule on this project is that growable datasets get server-side
 * filtering -- that is why the article index is URL-driven. Authors are not a
 * growable dataset in the same sense: a newsroom has tens of bylines, not
 * thousands, and the whole list is already in memory. Adding a round trip per
 * keystroke would be slower and more code for no benefit.
 */
export default function AuthorDirectoryTable({ authors }: { authors: AuthorRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return authors;
    return authors.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        (a.headline?.toLowerCase().includes(q) ?? false) ||
        (a.role?.toLowerCase().includes(q) ?? false) ||
        (a.linkedUserEmail?.toLowerCase().includes(q) ?? false)
    );
  }, [authors, query]);

  if (authors.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-line rounded-xl">
        <p className="text-sm font-semibold text-ink">No authors yet</p>
        <p className="text-xs text-muted mt-1.5 max-w-sm mx-auto leading-relaxed">
          An author record is created when a user completes their profile, or
          when one is added for a guest contributor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search
          className="w-4 h-4 text-faint absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name, slug, title or email"
          aria-label="Filter authors"
          className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder-faint focus:border-accent focus:outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-xl">
          <p className="text-sm text-muted">
            No author matches <span className="text-ink font-semibold">{query}</span>.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-[2.5fr_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-line bg-surface-2/60 text-[11px] uppercase tracking-wider font-semibold text-muted">
            <span>Author</span>
            <span className="text-right">Published</span>
            <span className="text-right">Total</span>
            <span className="text-right">Views</span>
            <span className="w-16" />
          </div>

          <div className="divide-y divide-line">
            {filtered.map((a) => (
              <div
                key={a.id}
                className="grid grid-cols-1 md:grid-cols-[2.5fr_1fr_1fr_1fr_auto] gap-2 md:gap-4 px-4 py-3.5 md:items-center hover:bg-surface-2/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {a.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.avatar}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-line shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-surface-2 border border-line flex items-center justify-center text-xs font-bold text-muted shrink-0">
                      {a.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-ink truncate">
                        {a.name}
                      </span>
                      {a.verifiedTitle && (
                        <BadgeCheck
                          className="w-3.5 h-3.5 text-accent shrink-0"
                          aria-label="Verified title"
                        />
                      )}
                      {!a.linkedUserEmail && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-muted bg-surface-2 border border-line rounded px-1.5 py-0.5 shrink-0"
                          title="This byline has no console account"
                        >
                          <UserX className="w-3 h-3" aria-hidden="true" />
                          Guest
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted truncate">
                      {a.role || a.headline || a.linkedUserEmail || `/${a.slug}`}
                    </div>
                  </div>
                </div>

                <div className="text-sm text-ink md:text-right tabular-nums">
                  <span className="md:hidden text-xs text-muted mr-1.5">Published</span>
                  {a.publishedArticles}
                </div>
                <div className="text-sm text-muted md:text-right tabular-nums">
                  <span className="md:hidden text-xs text-muted mr-1.5">Total</span>
                  {a.totalArticles}
                </div>
                <div className="text-sm text-muted md:text-right tabular-nums">
                  <span className="md:hidden text-xs text-muted mr-1.5">Views</span>
                  {a.totalViews.toLocaleString("en-US")}
                </div>

                <div className="flex items-center gap-1.5 md:justify-end">
                  <Link
                    href={`/admin/articles?author=${a.id}`}
                    className="px-2.5 py-1.5 text-xs font-semibold text-ink bg-surface-2 hover:bg-surface-3 border border-line rounded-md transition-colors"
                    title={`Show articles by ${a.name}`}
                  >
                    Articles
                  </Link>
                  {a.linkedUserId && (
                    <Link
                      href={`/admin/settings?tab=profile&edit=true&user=${a.linkedUserId}`}
                      className="px-2.5 py-1.5 text-xs font-semibold text-ink bg-surface-2 hover:bg-surface-3 border border-line rounded-md transition-colors"
                      title={`Edit ${a.name}'s profile`}
                    >
                      Edit
                    </Link>
                  )}
                  <Link
                    href={`/author/${a.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted hover:text-ink border border-line rounded-md transition-colors"
                    title="View public profile"
                    aria-label={`View public profile for ${a.name}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
