import Link from "next/link";
import { db } from "@/lib/db";
import { ARTICLE_CARD_SELECT } from "@/lib/queries";
import AdUnit from "@/components/common/AdUnit";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

export default async function Sidebar() {
  let mostRead: any[] = [];
  try {
    const dbMostRead = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        contentHtml: true,
        category: {
          select: { name: true }
        }
      }
    });

    if (dbMostRead && dbMostRead.length > 0) {
      mostRead = dbMostRead.map((a, idx) => {
        const text = (a.contentHtml || "").replace(/<[^>]*>?/gm, '');
        const wordCount = text.split(/\s+/).filter(Boolean).length;
        const calculatedTime = Math.max(1, Math.ceil(wordCount / 200));
        
        return {
          id: a.id,
          rank: idx + 1,
          slug: a.slug,
          title: a.title,
          catName: a.category?.name || "News",
          calculatedTime
        };
      });
    }
  } catch (error) {
    console.error("Failed to fetch most read articles for sidebar:", error);
  }

  return (
    <aside className="side-col" aria-label="Sidebar">
      {/* Most Read */}
      <section className="panel" aria-labelledby="mrH">
        <h2 className="panel-h" id="mrH">Most Read</h2>
        {mostRead.length > 0 ? (
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
                  <span className="mr-cat">{a.catName} · {a.calculatedTime} MIN READ</span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted" style={{ fontSize: "14px", marginTop: "12px" }}>No articles available yet.</p>
        )}
      </section>

      {/* Sidebar Ad */}
      <AdUnit location="sidebar" size="300 × 250" slotClass="ad-mrec" style={{ padding: 0, marginTop: "32px", marginBottom: "32px" }} />

      <div className="trust-card">
        <h3>How we work</h3>
        <p>xSypher stories are reported, fact-checked and edited before publication. We correct errors openly and label opinion clearly. We buy our own review units and accept no payment for coverage.</p>
        <Link href="/page/editorial">Read our editorial standards →</Link>
      </div>

      <NewsletterSignup style={{ borderRadius: "var(--r-lg)" }} />
    </aside>
  );
}
