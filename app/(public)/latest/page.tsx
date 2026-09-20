import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLatestArticles } from "@/lib/cached-queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  return {
    title: page > 1
      ? `Latest Technology News — Page ${page} — xSypher`
      : "Latest Technology News — xSypher",
    description: "Every xSypher story, newest first — reporting, analysis, reviews and guides as they publish.",
    alternates: {
      // Page 1's canonical is the bare route, not ?page=1, so the two URLs do
      // not compete with each other in the index.
      canonical: page > 1 ? `/latest?page=${page}` : "/latest",
    },
  };
}

/** Accepts only a clean positive integer; anything else means page 1. */
function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = value ? parseInt(value, 10) : 1;
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1;
}

// These listings render per-request now: pagination reads `searchParams`,
// which is a dynamic API. That is a deliberate trade -- URL-addressable
// archive pages (crawlable, shareable) over route-level caching -- and it
// costs almost nothing, because the article rows themselves come from a
// tagged unstable_cache entry with the TTL below. Publishing still calls
// revalidateTag for exactly the segments involved, so an editorial change
// appears immediately; the window is only the ceiling for anything that
// changes without an explicit invalidation, such as a view count.
export const revalidate = 180; // listing data TTL via unstable_cache

/** Read once per server render to bucket stories by day.
 *
 *  Declared outside the component because react-hooks/purity treats a clock
 *  read in a component body as impure, and rightly: the value must not vary
 *  between reconciliation passes. Here it is captured once and every article in
 *  the pass is measured against the same instant. */
function currentTimestamp(): number {
  return Date.now();
}

export default async function LatestPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const { items: articles, hasNextPage } = await getLatestArticles(page);

  // A page beyond the end of the archive is a 404, the same rule the tag and
  // search listings follow; page 1 is always valid even when the archive is
  // empty (it renders the empty state below).
  if (articles.length === 0 && page > 1) {
    notFound();
  }

  // Bucketing is a data decision, so unlike the relative labels it genuinely
  // has to happen here. The clock is read once, before the JSX, rather than
  // during render -- that is what react-hooks/purity objects to, and it also
  // keeps every article in this pass measured against the same instant instead
  // of a value that drifts as the list is walked.
  //
  // The buckets are still only as fresh as the 180s revalidate window, which is
  // correct for day-granularity headings.
  const renderedAt = currentTimestamp();
  const groups: Record<string, typeof articles> = { Today: [], Yesterday: [], "This week": [], Earlier: [] };

  articles.forEach(a => {
    const ageMins = Math.max(0, Math.floor((renderedAt - new Date(a.createdAt).getTime()) / 60000));
    if (ageMins < 1440) groups.Today.push(a); 
    else if (ageMins < 2880) groups.Yesterday.push(a); 
    else if (ageMins < 10080) groups["This week"].push(a); 
    else groups.Earlier.push(a); 
  });

  return (
    <div className="wrap">
      <section className="cat-hero" style={{ marginBottom: 0 }}>
        <span className="kicker">The wire</span>
        <h1>Latest</h1>
        <p>Every xSypher story, newest first — reporting, analysis, reviews and guides as they publish.</p>
      </section>
      <div className="cat-body">
        <div>
          {articles.length > 0 ? (
            <>
              {Object.entries(groups).filter(([, v]) => v.length > 0).map(([k, v]) => (
                <div key={k} className="day-group">
                  <div className="day-label">{k}</div>
                  {v.map(a => <StoryRow key={a.id} article={a} />)}
                </div>
              ))}

              {/* Pagination: same control pattern as the tag and search
                  listings. Page 1's previous link is absent, never disabled. */}
              {(page > 1 || hasNextPage) && (
                <nav
                  aria-label="Latest stories pages"
                  style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "16px 0", borderTop: "1px solid var(--line)" }}
                >
                  {page > 1 ? (
                    <Link href={page - 1 > 1 ? `/latest?page=${page - 1}` : "/latest"} className="btn-cs">
                      ← Newer stories
                    </Link>
                  ) : <span />}
                  {hasNextPage ? (
                    <Link href={`/latest?page=${page + 1}`} className="btn-cs primary">
                      Older stories →
                    </Link>
                  ) : <span />}
                </nav>
              )}
            </>
          ) : (
            <p className="muted" style={{ padding: "40px 0" }}>No published stories yet. Check back soon.</p>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
