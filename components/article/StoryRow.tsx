import Image from "next/image";
import Link from "next/link";
import { Article, Category } from "@prisma/client";
import { getImgSrc, timeAgo } from "@/lib/utils";

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
  
  let ageMins = 0;
  if (a.createdAt) {
    ageMins = Math.max(0, Math.floor((Date.now() - new Date(a.createdAt).getTime()) / 60000));
  } else if (typeof a.age === "number") {
    ageMins = a.age;
  }
  
  return (
    <article className="story-row" data-reveal>
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
          {a.author || "xSypher Staff"} · {timeAgo(ageMins)} · {a.mins || 5} min read
        </div>
      </div>
    </article>
  );
}
