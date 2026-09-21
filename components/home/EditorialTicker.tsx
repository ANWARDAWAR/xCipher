"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface TickerArticle {
  slug: string;
  title: string;
  category?: { name: string | null } | null;
}

export default function EditorialTicker({ articles }: { articles: TickerArticle[] }) {
  const [isPaused, setIsPaused] = useState(false);

  if (!articles || articles.length === 0) return null;

  return (
    <div 
      className="editorial-ticker-wrapper"
      role="region" 
      aria-label="Live editorial dispatch"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className={`editorial-ticker-track ${isPaused ? "paused" : ""}`}>
        {/* Double the list to create a seamless infinite scroll effect */}
        {[...articles, ...articles].map((article, i) => (
          <span key={`${article.slug}-${i}`} className="editorial-ticker-item">
            <Link href={`/article/${article.slug}`} className="hover:text-[var(--accent)] transition-colors flex items-center gap-2">
              <span className="ticker-cat text-[var(--accent)] font-bold text-[10px] uppercase tracking-wider">
                {article.category?.name || "Intelligence"}
              </span>
              <span className="ticker-title font-semibold text-sm text-[var(--ink)]">
                {article.title}
              </span>
            </Link>
            <span className="ticker-separator text-[var(--muted)] mx-4">|</span>
          </span>
        ))}
      </div>
    </div>
  );
}
