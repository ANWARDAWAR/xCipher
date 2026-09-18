"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, AlertTriangle, Copy, ImageOff } from "lucide-react";
import { showToast } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Client-side filtering is deliberate and bounded here.
//
// The article list is server-filtered because it grows without limit. This set
// does not: it is the distinct lead images across at most 500 recent articles,
// so a few hundred rows at the very most, already in memory. Round-tripping to
// the server to filter an in-memory array of that size would be slower and
// would add a query path for no benefit.
//
// If uploads ever land and this becomes a real asset table, it should move to
// server-side filtering like the article index.
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaItem {
  url: string;
  host: string | null;
  approved: boolean;
  lastUsed: string;
  usages: { id: string; title: string; status: string }[];
}

type Filter = "all" | "unapproved" | "reused";

export default function MediaLibraryClient({ items }: { items: MediaItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [broken, setBroken] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "unapproved" && item.approved) return false;
      if (filter === "reused" && item.usages.length < 2) return false;
      if (!q) return true;
      return (
        item.url.toLowerCase().includes(q) ||
        (item.host ?? "").toLowerCase().includes(q) ||
        item.usages.some((u) => (u.title ?? "").toLowerCase().includes(q))
      );
    });
  }, [items, query, filter]);

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast("Image URL copied.");
    } catch {
      showToast("Could not copy to the clipboard.");
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-2">
        <ImageOff className="w-8 h-8 text-faint mx-auto" aria-hidden="true" />
        <p className="text-sm text-muted font-[var(--f-ui)]">
          No articles you can see have a lead image yet.
        </p>
      </div>
    );
  }

  const counts = {
    all: items.length,
    unapproved: items.filter((i) => !i.approved).length,
    reused: items.filter((i) => i.usages.length > 1).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by URL, host or article"
            aria-label="Search media"
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-line rounded-md text-sm text-ink"
          />
        </div>

        <div className="flex items-center gap-1" role="group" aria-label="Filter media">
          {(["all", "unapproved", "reused"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                filter === f
                  ? "bg-ink text-surface"
                  : "text-muted hover:text-ink hover:bg-surface-2"
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted py-12 text-center font-[var(--f-ui)]">
          No images match this search.
        </p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {filtered.map((item) => (
            <li key={item.url} className="space-y-3">
              <div className="relative aspect-[16/10] bg-surface-2 rounded-md overflow-hidden border border-line">
                {broken.has(item.url) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted">
                    <ImageOff className="w-5 h-5" aria-hidden="true" />
                    <span className="text-xs">Failed to load</span>
                  </div>
                ) : (
                  // Plain img rather than next/image on purpose: an unapproved
                  // host is by definition absent from next.config's remote
                  // patterns, so next/image would throw for exactly the images
                  // this page exists to help you find.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.url}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={() =>
                      setBroken((prev) => new Set(prev).add(item.url))
                    }
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-ink font-[var(--f-ui)] break-all">
                    {item.host ?? "Invalid URL"}
                  </span>
                  {!item.approved && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--warn)]">
                      <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                      Not approved
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => copy(item.url)}
                    className="ml-auto p-1 text-muted hover:text-ink transition-colors"
                    aria-label={`Copy URL for the image on "${item.usages[0]?.title ?? "an article"}"`}
                  >
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>

                <p className="text-xs text-muted font-[var(--f-ui)]">
                  Used on {item.usages.length} article
                  {item.usages.length === 1 ? "" : "s"}
                </p>

                <ul className="space-y-0.5">
                  {item.usages.slice(0, 3).map((u) => (
                    <li key={u.id}>
                      <Link
                        href={`/admin/articles/${u.id}`}
                        className="text-xs text-ink hover:text-accent transition-colors line-clamp-1"
                      >
                        {u.title || "Untitled"}
                      </Link>
                    </li>
                  ))}
                  {item.usages.length > 3 && (
                    <li className="text-xs text-muted">
                      and {item.usages.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
