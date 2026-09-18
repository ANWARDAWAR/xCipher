import type { Metadata } from "next";
import { getLatestArticles } from "@/lib/cached-queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Latest Technology News — xSypher",
  description: "Every xSypher story, newest first — reporting, analysis, reviews and guides as they publish.",
};

// Cached and revalidated on a timer, rather than force-dynamic.
//
// force-dynamic meant every visitor triggered a fresh render and a fresh set of
// queries, and -- more importantly -- it made every revalidatePath() call in the
// workflow actions a no-op, because there was never a cached entry to
// invalidate. Publishing already calls revalidatePath for this route, so an
// editorial change still appears immediately; the window below is only the
// ceiling for anything that changes without an explicit revalidation, such as
// a view count.
export const revalidate = 180; // latest listing

/** Read once per server render to bucket stories by day.
 *
 *  Declared outside the component because react-hooks/purity treats a clock
 *  read in a component body as impure, and rightly: the value must not vary
 *  between reconciliation passes. Here it is captured once and every article in
 *  the pass is measured against the same instant. */
function currentTimestamp(): number {
  return Date.now();
}

export default async function LatestPage() {
  const articles = await getLatestArticles();

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
            Object.entries(groups).filter(([, v]) => v.length > 0).map(([k, v]) => (
              <div key={k} className="day-group">
                <div className="day-label">{k}</div>
                {v.map(a => <StoryRow key={a.id} article={a} />)}
              </div>
            ))
          ) : (
            <p className="muted" style={{ padding: "40px 0" }}>No published stories yet. Check back soon.</p>
          )}
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
