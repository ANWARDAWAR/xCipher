import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ARTICLE_CARD_SELECT, LATEST_ARTICLE_LIMIT } from "@/lib/queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Latest Technology News — xCipher",
  description: "Every xCipher story, newest first — reporting, analysis, reviews and guides as they publish.",
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

export default async function LatestPage() {
  const articles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take: LATEST_ARTICLE_LIMIT,
    select: ARTICLE_CARD_SELECT,
  });

  const now = Date.now();
  const groups: Record<string, typeof articles> = { Today: [], Yesterday: [], "This week": [], Earlier: [] };
  
  articles.forEach(a => {
    const ageMins = Math.max(0, Math.floor((now - new Date(a.createdAt).getTime()) / 60000));
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
        <p>Every xCipher story, newest first — reporting, analysis, reviews and guides as they publish.</p>
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
