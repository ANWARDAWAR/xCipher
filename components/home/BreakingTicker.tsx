"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
// Declares only the three fields this component reads, rather than the whole
// Article row.
//
// It previously asked for `Article & { category }`, but every caller passes the
// ARTICLE_CARD_SELECT projection -- a deliberately narrow set of columns, with
// no contentHtml or contentJson, so a homepage render does not drag every
// article body out of the database. The full type made that projection a type
// error and would have been "fixed" by widening the query, which is the wrong
// direction: the ticker shows a headline and a category label.
//
// Structural typing means any richer object still satisfies this, so callers
// holding a full Article keep working.
export interface TickerArticle {
  slug: string;
  title: string;
  category?: { name: string | null } | null;
}

interface Props {
  articles: TickerArticle[];
}

export default function BreakingTicker({ articles }: Props) {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (articles.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % articles.length);
    }, 5500);

    return () => clearInterval(interval);
  }, [articles.length, isPaused]);

  if (articles.length === 0) return null;

  const currentArticle = articles[index];
  const catName = currentArticle.category?.name || "News";

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + articles.length) % articles.length);
  };

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % articles.length);
  };

  return (
    <div 
      className="ticker" 
      role="region" 
      aria-label="Breaking news"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="wrap ticker-in flex items-center">
        <span className="tick-label text-[9px] px-2 py-0.5 tracking-wider md:text-xs shrink-0">
          <span className="tick-dot" aria-hidden="true"></span>LATEST
        </span>
        <div className="tick-stage flex-1 min-w-0 flex items-center" aria-live="polite">
          <Link className="tick-item flex items-center min-w-0 w-full flex-1" id="tickItem" href={`/article/${currentArticle.slug}`}>
            <span className="tick-cat hidden sm:block shrink-0 mr-1.5" id="tickCat">{catName}</span>
            <span id="tickText" className="truncate w-full min-w-0 text-xs sm:text-sm">{currentArticle.title}</span>
          </Link>
        </div>
        <div className="tick-ctrl shrink-0">
          <button id="tickPrev" aria-label="Previous headline" onClick={handlePrev}>
            <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m14 6-6 6 6 6" />
            </svg>
          </button>
          <span className="tick-count" id="tickCount">{index + 1}/{articles.length}</span>
          <button id="tickNext" aria-label="Next headline" onClick={handleNext}>
            <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m10 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
