import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let publishedCount = 0;
  let draftsCount = 0;
  let totalArticles = 0;
  let totalViews = 0;
  let topStories: any[] = [];
  let latestDrafts: any[] = [];

  try {
    publishedCount = await db.article.count({ where: { status: "PUBLISHED" } });
    draftsCount = await db.article.count({ where: { status: "DRAFT" } });
    totalArticles = publishedCount + draftsCount;
    
    const viewsAggregation = await db.article.aggregate({ _sum: { views: true }, where: { status: "PUBLISHED" } });
    totalViews = viewsAggregation._sum.views || 0;

    topStories = await db.article.findMany({ where: { status: "PUBLISHED" }, orderBy: { views: "desc" }, take: 5, include: { category: true } });
    latestDrafts = await db.article.findMany({ where: { status: "DRAFT" }, orderBy: { updatedAt: "desc" }, take: 5 });
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
  }

  return (
    <>
      <div className="cs-stats">
        <div className="stat">
          <div className="s-l">Total articles</div>
          <div className="s-v">{totalArticles}</div>
          <div className="s-d">Indexed in system</div>
        </div>
        <div className="stat">
          <div className="s-l">Published</div>
          <div className="s-v">{publishedCount}</div>
          <div className="s-d">Live on site</div>
        </div>
        <div className="stat">
          <div className="s-l">In progress</div>
          <div className="s-v">{draftsCount}</div>
          <div className="s-d">Drafts queued</div>
        </div>
        <div className="stat">
          <div className="s-l">Total reads</div>
          <div className="s-v">{fmtViews(totalViews)}</div>
          <div className="s-d">Across all stories</div>
        </div>
      </div>

      <div className="cs-split">
        <div className="cs-card">
          <h2>Top stories by reads</h2>
          {topStories.length > 0 ? (
            topStories.map(s => (
              <div className="cs-row" key={s.id}>
                <span className="t">{s.title}</span>
                <span className="m">{s.category?.name || "News"}</span>
                <span className="m">{fmtViews(s.views || 0)}</span>
                <Link href={`/admin/editor/${s.id}`} className="act">Edit</Link>
              </div>
            ))
          ) : (
            <p className="cs-sub" style={{ margin: 0 }}>No published stories yet.</p>
          )}
        </div>

        <div className="cs-card">
          <h2>Recent drafts</h2>
          {latestDrafts.length > 0 ? (
            latestDrafts.map(d => (
              <div className="cs-row" key={d.id}>
                <span className="t">{d.title || "Untitled story"}</span>
                <span className="m">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>
                <Link href={`/admin/editor/${d.id}`} className="act">Continue</Link>
              </div>
            ))
          ) : (
            <p className="cs-sub" style={{ margin: 0 }}>No drafts in progress.</p>
          )}
          <p style={{ marginTop: "16px" }}>
            <Link href="/admin/editor" className="btn-cs primary">+ Start new story</Link>
          </p>
        </div>
      </div>
    </>
  );
}
