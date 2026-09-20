import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCategoryArticles } from "@/lib/cached-queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";
import { getImgSrc } from "@/lib/utils";
import RelativeTime from "@/components/common/RelativeTime";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Accepts only a clean positive integer; anything else means page 1. */
function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = value ? parseInt(value, 10) : 1;
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const cat = await db.category.findUnique({
    where: { slug },
  });

  // Categories are editorial data from the database. The old code fell back to
  // a hardcoded mock catalogue, which invented sections that did not exist and
  // rendered them as if they did.
  if (!cat) return { title: "Category — xSypher" };

  return {
    title: page > 1 ? `${cat.name} — Page ${page} — xSypher` : `${cat.name} — xSypher`,
    description: cat.description || `${cat.name} news and updates on xSypher.`,
    alternates: {
      canonical: page > 1 ? `/category/${cat.slug}?page=${page}` : `/category/${cat.slug}`,
    },
  };
}

// These listings render per-request now: pagination reads `searchParams`,
// which is a dynamic API. That is a deliberate trade -- URL-addressable
// archive pages (crawlable, shareable) over route-level caching -- and it
// costs almost nothing, because the article rows themselves come from a
// tagged unstable_cache entry with the TTL below. Publishing still calls
// revalidateTag for exactly the segments involved, so an editorial change
// appears immediately; the window is only the ceiling for anything that
// changes without an explicit invalidation, such as a view count.
export const revalidate = 300; // listing data TTL via unstable_cache

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const category = await db.category.findUnique({
    where: { slug },
  });

  // A category that is not in the database does not exist. The mock fallback
  // used to invent one anyway; an unknown slug is now a genuine 404.
  if (!category) {
    notFound();
  }

  const catName = category.name;
  const catFullTitle = category.fullTitle || catName;
  const catDesc = category.description || `${catName} news and updates on xSypher.`;

  // Tagged per category, so an article landing in AI does not invalidate the
  // twelve other sections. Paginated: the archive used to stop at a hard cap,
  // orphaning every story older than the cutoff.
  const { items: articles, hasNextPage } = await getCategoryArticles(slug, page);

  if (articles.length === 0 && page > 1) {
    notFound();
  }

  // The large feature treatment is a page-1 affair; deeper pages are a plain
  // chronological list, same as the wire's older pages.
  const feat = page === 1 ? articles[0] : undefined;
  const rest = page === 1 ? articles.slice(1) : articles;

  // Total across the whole section, not the page size: the hero has always
  // advertised a story count, and reporting only the current page's rows would
  // silently shrink it as the archive grows.
  const totalCount = await db.article.count({
    where: { status: "PUBLISHED", categoryId: category.id },
  });

  return (
    <div className="wrap">
      <section className="cat-hero">
        <span className="kicker">xSypher section</span>
        <h1>{catFullTitle}</h1>
        <p>{catDesc}</p>
        <div className="ch-meta">
          <span>{totalCount} {totalCount === 1 ? "story" : "stories"}{page > 1 ? ` · page ${page}` : ""}</span>
          <span>Updated {articles[0] ? <RelativeTime dateTime={new Date(articles[0].createdAt).toISOString()} /> : "recently"}</span>
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
                  <div className="ava sm">{(feat.author || "xSypher").charAt(0)}</div>
                  <span><b>{feat.author || "xSypher Staff"}</b> <span className="dot">·</span> {<RelativeTime dateTime={new Date(feat.createdAt).toISOString()} />}</span>
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

          {/* Pagination: same control pattern as the tag, search and wire
              listings. Without it every story past the page size was
              unreachable from this section entirely. */}
          {(page > 1 || hasNextPage) && (
            <nav
              aria-label={`${catName} pages`}
              style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "16px 0", borderTop: "1px solid var(--line)" }}
            >
              {page > 1 ? (
                <Link href={page - 1 > 1 ? `/category/${slug}?page=${page - 1}` : `/category/${slug}`} className="btn-cs">
                  ← Newer stories
                </Link>
              ) : <span />}
              {hasNextPage ? (
                <Link href={`/category/${slug}?page=${page + 1}`} className="btn-cs primary">
                  Older stories →
                </Link>
              ) : <span />}
            </nav>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
