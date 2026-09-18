import Image from "next/image";
import Link from "next/link";
import { Article, Category } from "@prisma/client";
import { getImgSrc, timeAgo } from "@/lib/utils";

export type StoryCardArticle = Partial<Article> & {
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
  article: StoryCardArticle;
  showDeck?: boolean;
}

export default function StoryCard({ article: a, showDeck = true }: Props) {
  const catName = a.category?.name || (typeof a.cat === "string" ? a.cat.toUpperCase() : "News");
  const catSlug = a.category?.slug || (typeof a.cat === "string" ? a.cat.toLowerCase() : "news");
  
  let ageMins = 0;
  if (a.createdAt) {
    ageMins = Math.max(0, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000));
  } else if (typeof a.age === "number") {
    ageMins = a.age;
  }
  
  return (
    <article className="story-card" data-reveal>
      <Link href={`/article/${a.slug}`} className="ph r-32" tabIndex={-1} aria-hidden="true">
        <Image 
          src={getImgSrc(a.img || "", 640, 427)} 
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
        {showDeck && <p className="story-deck">{a.deck}</p>}
        <div className="byline" style={{ marginTop: "8px" }}>
          <span>{a.author || "xSypher Staff"} · {timeAgo(ageMins)} · {a.mins || 5} min read</span>
        </div>
      </div>
    </article>
  );
}
