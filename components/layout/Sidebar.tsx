import Link from "next/link";
import { db } from "@/lib/db";
import { ARTICLES, CATS } from "@/lib/mockData";
import { fmtViews } from "@/lib/utils";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

export default async function Sidebar() {
  let mostRead: any[] = [];
  try {
    const dbMostRead = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: 5,
      include: { category: true },
    });

    if (dbMostRead && dbMostRead.length > 0) {
      mostRead = dbMostRead.map((a, idx) => ({
        id: a.id,
        rank: idx + 1,
        slug: a.slug,
        title: a.title,
        catName: a.category?.name || "News",
        views: a.views || 0,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch most read articles for sidebar:", error);
  }

  // Fallback to mock data if database has no published articles
  if (mostRead.length === 0) {
    mostRead = [...ARTICLES]
      .filter(a => a.most)
      .sort((a, b) => (a.most || 0) - (b.most || 0))
      .slice(0, 5)
      .map(a => ({
        id: a.id,
        rank: a.most || 1,
        slug: a.slug,
        title: a.title,
        catName: (CATS as any)[a.cat]?.name || "News",
        views: a.views,
      }));
  }

  return (
    <aside className="side-col" aria-label="Sidebar">
      {/* Most Read */}
      <section className="panel" aria-labelledby="mrH">
        <h2 className="panel-h" id="mrH">Most Read</h2>
        <ol className="mostread">
          {mostRead.map(a => (
            <li key={a.id}>
              <span className="rank">{String(a.rank).padStart(2, "0")}</span>
              <div>
                <h3>
                  <Link href={`/article/${a.slug}`}>
                    <span className="hlink">{a.title}</span>
                  </Link>
                </h3>
                <span className="mr-cat">{a.catName} · {fmtViews(a.views)} reads</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Sidebar Ad */}
      <div className="ad-wrap" style={{ padding: 0 }}>
        <div className="ad-label">Advertisement</div>
        <div className="ad-slot ad-mrec" data-ad-location="sidebar" data-size="300 × 250" role="complementary" aria-label="Advertisement placement"></div>
      </div>

      <div className="trust-card">
        <h3>How we work</h3>
        <p>xCipher stories are reported, fact-checked and edited before publication. We correct errors openly and label opinion clearly. We buy our own review units and accept no payment for coverage.</p>
        <Link href="/page/editorial">Read our editorial standards →</Link>
      </div>

      <NewsletterSignup style={{ borderRadius: "var(--r-lg)" }} />
    </aside>
  );
}
