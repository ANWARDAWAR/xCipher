"use client";

import React, { useId, useRef, useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { getMoreArticles } from "@/app/actions/feed-actions";
import type { FeedArticle, FeedFilter } from "@/lib/feed";
import StoryRow from "./StoryRow";

interface Props {
  initialArticles: FeedArticle[];
  filter?: FeedFilter;
  initialPageSize?: number;
  /** Rows already rendered separately, or skipped by a legacy page URL. */
  initialOffset?: number;
  initialHasMore?: boolean;
  bucketAt?: number;
}

const PAGE_SIZE = 20;

export default function PaginatedFeed(props: Props) {
  // A route/filter refresh must discard the previous feed's client state.
  const key = JSON.stringify([props.filter, props.initialOffset, props.initialArticles]);
  return <Feed key={key} {...props} />;
}

function Feed({ initialArticles, filter, initialPageSize = PAGE_SIZE, initialOffset = 0, initialHasMore, bucketAt }: Props) {
  const [articles, setArticles] = useState(initialArticles);
  const [loading, startTransition] = useTransition();
  const [hasMore, setHasMore] = useState(initialHasMore ?? initialArticles.length >= initialPageSize);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const offset = useRef(initialOffset + initialArticles.length);
  const inFlight = useRef(false);
  const feedId = useId();

  function loadMore() {
    if (inFlight.current || !hasMore) return;
    inFlight.current = true;
    setError("");
    startTransition(async () => {
      try {
        const next = await getMoreArticles(offset.current, PAGE_SIZE, filter);
        // Count consumed rows independently of duplicates if new stories publish
        // between requests and move the offset window.
        offset.current += next.length;
        setArticles(previous => {
          const ids = new Set(previous.map(article => article.id));
          return [...previous, ...next.filter(article => !ids.has(article.id))];
        });
        setHasMore(next.length === PAGE_SIZE);
        setMessage(next.length ? "More articles loaded." : "All articles loaded.");
      } catch {
        setError("Could not load more articles. Please try again.");
      } finally {
        inFlight.current = false;
      }
    });
  }

  const groups: Record<string, FeedArticle[]> = bucketAt === undefined
    ? { "": articles }
    : { Today: [], Yesterday: [], "This week": [], Earlier: [] };
  if (bucketAt !== undefined) {
    articles.forEach(article => {
      const minutes = Math.max(0, (bucketAt - new Date(article.publishedAt ?? article.createdAt).getTime()) / 60000);
      const label = minutes < 1440 ? "Today" : minutes < 2880 ? "Yesterday" : minutes < 10080 ? "This week" : "Earlier";
      groups[label].push(article);
    });
  }

  return (
    <div className="min-w-0">
      <div id={feedId} aria-busy={loading}>
        {Object.entries(groups).filter(([, rows]) => rows.length > 0).map(([label, rows]) => (
          <div key={label} className={label ? "day-group" : undefined}>
            {label && <div className="day-label">{label}</div>}
            {rows.map(article => <StoryRow key={article.id} article={article} />)}
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">{message}</p>
      {error && <p role="alert" className="mt-4 text-sm text-[var(--muted)]">{error}</p>}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            aria-controls={feedId}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-6 py-3 text-sm font-semibold text-[var(--ink)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-wait disabled:opacity-60"
          >
            {loading && <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin motion-reduce:animate-none" />}
            {loading ? "Loading…" : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
