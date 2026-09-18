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
        mins: (a as any).mins || 5, // fallback if schema doesn't have it explicitly typed
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
        mins: (a as any).mins || 5,
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
                <span className="mr-cat">{a.catName} · {a.mins || 5} min read</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Sidebar Ad */}
      <div className="ad-wrap" style={{ padding: 0, marginTop: "32px", marginBottom: "32px" }}>
        <div className="text-[10px] uppercase tracking-wider text-[var(--muted)] mb-2 font-medium">Advertisement</div>
        <div className="bg-[var(--surface)] border border-[var(--line)] rounded-xl h-[250px] flex flex-col items-center justify-center p-6 text-center text-[var(--muted)] transition-colors hover:border-[var(--line-2)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-3 opacity-50">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span className="font-semibold text-sm text-[var(--ink-2)]">Sponsor Slot Available</span>
          <span className="text-xs mt-1">Reach our technology audience.</span>
        </div>
      </div>

      <div className="trust-card">
        <h3>How we work</h3>
        <p>xSypher stories are reported, fact-checked and edited before publication. We correct errors openly and label opinion clearly. We buy our own review units and accept no payment for coverage.</p>
        <Link href="/page/editorial">Read our editorial standards →</Link>
      </div>

      <NewsletterSignup style={{ borderRadius: "var(--r-lg)" }} />
    </aside>
  );
}
