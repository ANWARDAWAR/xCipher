import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCategoryArticles } from "@/lib/cached-queries";
import { siteConfig } from "@/lib/seo";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";
import { getImgSrc } from "@/lib/utils";
import RelativeTime from "@/components/common/RelativeTime";
import AdUnit from "@/components/common/AdUnit";
import SubcategoryStrip from "@/components/category/SubcategoryStrip";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await db.category.findUnique({
    where: { slug },
  });

  const catName = cat?.name;
  const catDesc = cat?.description;

  if (!catName) return { title: `Category — ${siteConfig.name}` };

  return {
    title: `${catName} — ${siteConfig.name}`,
    description: catDesc || `${catName} news and updates on ${siteConfig.name}.`,
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

// Cached and revalidated on a timer, rather than force-dynamic.
//
// force-dynamic meant every visitor triggered a fresh render and a fresh set of
// queries, and -- more importantly -- it made every revalidatePath() call in the
// workflow actions a no-op, because there was never a cached entry to
// invalidate. Publishing already calls revalidatePath for this route, so an
// editorial change still appears immediately; the window below is only the
// ceiling for anything that changes without an explicit revalidation, such as
// a view count.
export const revalidate = 300; // category listing

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub } = await searchParams;
  const category = await db.category.findUnique({
    where: { slug },
  });

  if (!category) {
    notFound();
  }

  const subcategories = await db.category.findMany({
    where: { parent: { slug } },
    orderBy: { name: "asc" },
    select: { name: true, slug: true }
  });

  const catName = category.name || slug;
  const catFullTitle = category.fullTitle || catName;
  const catDesc = category.description || `${catName} news and updates on xSypher.`;

  // Tagged per category, so an article landing in AI does not invalidate the
  // twelve other sections.
  const articles = await getCategoryArticles(slug, sub);

  const feat = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="wrap">
      <section className="cat-hero">
        <span className="kicker">xSypher section</span>
        <h1>{catFullTitle}</h1>
        <p>{catDesc}</p>
        <div className="ch-meta">
          <span>{articles.length} {articles.length === 1 ? "story" : "stories"}</span>
          <span>Updated {feat ? <RelativeTime dateTime={new Date(feat.createdAt).toISOString()} /> : "recently"}</span>
        </div>
      </section>

      <SubcategoryStrip subcategories={subcategories} parentSlug={slug} />

      {/* Category Top Ad */}
      {/* Category Top Ad */}
      <AdUnit location="category-top" size="728 × 90" slotClass="ad-leaderboard" />

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
                <div className="byline" style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  {feat.authorModel?.avatar ? (
                    <Image src={feat.authorModel.avatar} width={24} height={24} alt={feat.authorModel?.name || feat.author || ""} className="rounded-full" />
                  ) : (
                    <div className="ava sm">{(feat.authorModel?.name || feat.author || "xSypher").charAt(0)}</div>
                  )}
                  <span><b>{feat.authorModel?.name || feat.author || "xSypher Staff"}</b> <span className="dot">·</span> {<RelativeTime dateTime={new Date(feat.createdAt).toISOString()} />} <span className="dot">·</span> {feat.readingTime || 1} min read</span>
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
