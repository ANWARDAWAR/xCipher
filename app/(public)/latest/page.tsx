import type { Metadata } from "next";
import { db } from "@/lib/db";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Latest Technology News — xCipher",
  description: "Every xCipher story, newest first — reporting, analysis, reviews and guides as they publish.",
};

export const dynamic = "force-dynamic";

export default async function LatestPage() {
  const articles = await db.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: { category: true },
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
