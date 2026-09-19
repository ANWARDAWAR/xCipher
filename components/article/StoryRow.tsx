import Image from "next/image";
import Link from "next/link";
import { Article, Category } from "@prisma/client";
import { getImgSrc, timeAgo } from "@/lib/utils";
import RelativeTime from "@/components/common/RelativeTime";

export type StoryArticle = Partial<Article> & {
  id: string;
  slug: string;
  title: string;
  deck?: string | null;
  author?: string | null;
  img?: string | null;
  createdAt?: Date | string | number;
  category?: Partial<Category> | null;
  cat?: string;
  age?: number;
  mins?: number;
  [key: string]: any;
};

interface Props {
  article: StoryArticle;
  showDeck?: boolean;
}

export default function StoryRow({ article: a, showDeck = true }: Props) {
  const catName = a.category?.name || (typeof a.cat === "string" ? a.cat.toUpperCase() : "News");
  const catSlug = a.category?.slug || (typeof a.cat === "string" ? a.cat.toLowerCase() : "news");
  
  // Relative time is computed in the browser, not here.
  //
  // This is a server component and these listings are cached with ISR, so a
  // Date.now() here was frozen into the cached HTML -- a story kept claiming
  // "2 minutes ago" for the whole revalidate window. Passing the absolute
  // timestamp down lets the client render it against the real current time.
  //
  // The legacy `age` field (minutes, from mock data) has no absolute timestamp
  // to hand over, so it still formats inline. That path is not served from the
  // database and is not cached against a clock.
  const ageNode = a.createdAt
    ? <RelativeTime dateTime={new Date(a.createdAt).toISOString()} />
    : typeof a.age === "number"
      ? timeAgo(a.age)
      : null;
  
  return (
    <article className="story-row" data-reveal suppressHydrationWarning>
      <Link href={`/article/${a.slug}`} className="ph" tabIndex={-1} aria-hidden="true">
        <Image 
          src={getImgSrc(a.img || "", 300, 225)} 
          alt={a.title} 
          fill
          className="object-cover"
        />
      </Link>
      <div>
        <Link href={`/category/${catSlug}`} className="kicker plain">
          {catName}
        </Link>
        <h3>
          <Link href={`/article/${a.slug}`}>
            <span className="hlink">{a.title}</span>
          </Link>
        </h3>
        {showDeck && <p className="row-deck">{a.deck}</p>}
        <div className="row-meta">
          {a.author || "xSypher Staff"} · {ageNode} · {a.mins || 5} min read
        </div>
      </div>
    </article>
  );
}
