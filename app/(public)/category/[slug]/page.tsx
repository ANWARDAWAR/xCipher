import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { CATS } from "@/lib/mockData";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";
import { getImgSrc, timeAgo } from "@/lib/utils";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.category.findUnique({
    where: { slug },
  });
  
  const fallbackCat = CATS[slug];
  const catName = cat?.name || fallbackCat?.name;
  const catDesc = cat?.description || fallbackCat?.desc;

  if (!catName) return { title: "Category — xCipher" };
  
  return {
    title: `${catName} — xCipher`,
    description: catDesc || `${catName} news and updates on xCipher.`,
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
  });
  
  const fallbackCat = CATS[slug];

  if (!category && !fallbackCat) {
    notFound();
  }

  const catName = category?.name || fallbackCat?.name || slug;
  const catFullTitle = category?.fullTitle || fallbackCat?.full || catName;
  const catDesc = category?.description || fallbackCat?.desc || `${catName} news and updates on xCipher.`;

  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(category ? { categoryId: category.id } : { category: { slug } }),
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const feat = articles[0];
  const rest = articles.slice(1);
  const featAgeMins = feat ? Math.max(0, Math.floor((Date.now() - new Date(feat.createdAt).getTime()) / 60000)) : 0;

  return (
    <div className="wrap">
      <section className="cat-hero">
        <span className="kicker">xCipher section</span>
        <h1>{catFullTitle}</h1>
        <p>{catDesc}</p>
        <div className="ch-meta">
          <span>{articles.length} {articles.length === 1 ? "story" : "stories"}</span>
          <span>Updated {feat ? timeAgo(featAgeMins) : "recently"}</span>
        </div>
      </section>
      
      {/* Category Top Ad */}
      <div className="ad-wrap">
        <div className="ad-label">Advertisement</div>
        <div className="ad-slot ad-leaderboard" data-ad-location="category-top" data-size="728 × 90" role="complementary" aria-label="Advertisement placement"></div>
      </div>
      
      <div className="cat-body">
        <div>
          {feat ? (
            <article className="cat-feat story" style={{ marginBottom: "34px" }} data-reveal>
              <Link href={`/article/${feat.slug}`} className="ph r-219" tabIndex={-1} aria-hidden="true">
                <Image 
                  src={getImgSrc(feat.img || "", 1100, 471)} 
                  alt={feat.title} 
                  fill 
                  className="object-cover"
                />
              </Link>
              <div>
                <Link href={`/category/${slug}`} className="kicker plain">Featured</Link>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.4rem,2.6vw,1.9rem)", fontWeight: 660, lineHeight: 1.12, letterSpacing: "-.015em", margin: "12px 0 10px" }}>
                  <Link href={`/article/${feat.slug}`}>
                    <span className="hlink">{feat.title}</span>
                  </Link>
                </h3>
                <p className="story-deck" style={{ fontSize: "15.5px" }}>{feat.deck}</p>
                <div className="byline" style={{ marginTop: "12px" }}>
                  <div className="ava sm">{(feat.author || "xCipher").charAt(0)}</div>
                  <span><b>{feat.author || "xCipher Staff"}</b> <span className="dot">·</span> {timeAgo(featAgeMins)} <span className="dot">·</span> 5 min read</span>
                </div>
              </div>
            </article>
          ) : null}
          
          {rest.length > 0 ? (
            <>
              <div className="day-label" style={{ marginBottom: "6px" }}>More in {catName}</div>
              {rest.map(a => <StoryRow key={a.id} article={a} />)}
            </>
          ) : !feat ? (
            <p className="muted" style={{ padding: "40px 0" }}>No stories published in {catName} yet.</p>
          ) : null}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
