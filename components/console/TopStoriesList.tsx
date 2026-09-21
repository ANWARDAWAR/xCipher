"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Clock, Eye, ExternalLink, Loader2 } from "lucide-react";
import { fmtViews } from "@/lib/utils";
import { getTopStories } from "@/app/admin/actions/dashboard-actions";

type TopStory = {
  id: string;
  title: string;
  slug: string;
  views: number;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  author: string | null;
  authorModel: { name: string } | null;
  category: { name: string; slug: string } | null;
};

export default function TopStoriesList({ initialStories }: { initialStories: TopStory[] }) {
  const [stories, setStories] = useState<TopStory[]>(initialStories);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialStories.length === 6);
  const LIMIT = 6;

  function formatDate(date: Date | string | null | undefined): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  const loadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextStories = await getTopStories(stories.length, LIMIT);
      if (nextStories.length < LIMIT) {
        setHasMore(false);
      }
      setStories((prev) => [...prev, ...nextStories]);
    } catch (error) {
      console.error("Failed to load more stories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="divide-y divide-line">
      {stories.length > 0 ? (
        <>
          {stories.map((story) => {
            const authorName = story.authorModel?.name || story.author || "xSypher Staff";
            return (
              <div
                key={story.id}
                className="p-4 sm:px-5 sm:py-3.5 hover:bg-surface-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/editor/${story.id}`}
                    className="text-sm font-semibold text-ink hover:text-accent transition-colors line-clamp-1 block"
                  >
                    {story.title}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-muted">
                    {story.category?.name && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-3 text-ink-2 text-[11px] font-medium">
                        <Folder className="w-2.5 h-2.5 text-muted" />
                        {story.category.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(story.publishedAt || story.createdAt)}
                    </span>
                    <span className="text-[11px] text-faint hidden sm:inline">·</span>
                    <span className="text-[11px] text-muted hidden sm:inline">{authorName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="flex items-center gap-1 text-xs font-semibold text-ink bg-surface-2 px-2.5 py-1 rounded border border-line">
                    <Eye className="w-3.5 h-3.5 text-muted" />
                    <span>{fmtViews(story.views || 0)}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/editor/${story.id}`}
                      className="px-2.5 py-1 text-xs font-medium rounded text-ink bg-surface hover:bg-surface-3 border border-line transition-colors"
                    >
                      Edit
                    </Link>
                    {story.slug && (
                      <Link
                        href={`/article/${story.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-muted hover:text-ink rounded hover:bg-surface-3 transition-colors"
                        title="Preview live article"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {hasMore && (
            <div className="p-4 flex justify-center bg-surface-2 border-t border-line">
              <button
                onClick={loadMore}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-3 active:bg-surface-2 text-ink text-xs font-semibold rounded-lg border border-line hover:border-line-2 shadow-sm transition-all duration-150 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Load More"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-line bg-surface-2 rounded-xl m-4">
          <div className="mb-2">
            <Eye className="w-5 h-5 text-faint" />
          </div>
          <h3 className="text-sm font-semibold text-ink mb-1">No stories found</h3>
          <p className="text-xs text-muted mb-4 max-w-[200px]">There are no published stories in the database yet.</p>
          <Link
            href="/admin/editor"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-line hover:border-line-2 shadow-sm hover:shadow rounded-lg transition-all"
          >
            <span>Create Story</span>
          </Link>
        </div>
      )}
    </div>
  );
}
