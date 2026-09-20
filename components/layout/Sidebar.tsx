import Link from "next/link";
import { db } from "@/lib/db";
import { fmtViews } from "@/lib/utils";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";
import { ARTICLE_CARD_SELECT } from "@/lib/queries";

export default async function Sidebar() {
  // Audit: when the database had no published articles this panel silently
  // fell back to the hardcoded mock stories, so a fresh deployment showed
  // fabricated headlines and authors that linked nowhere. An empty archive is
  // a real state and is now rendered as one; fake articles are never shown.
  let mostRead: {
    id: string;
    slug: string;
    title: string;
    catName: string;
    views: number;
  }[] = [];
  try {
    const dbMostRead = await db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { views: "desc" },
      take: 5,
      select: ARTICLE_CARD_SELECT,
    });

    mostRead = dbMostRead.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      catName: a.category?.name || "News",
      views: a.views || 0,
    }));
  } catch (error) {
    console.error("Failed to fetch most read articles for sidebar:", error);
  }

  return (
    <aside className="side-col" aria-label="Sidebar">
      {/* Most Read -- hidden entirely until there are real published stories
          to rank; a ranked list of five fake articles is not a fallback. */}
      {mostRead.length > 0 && (
        <section className="panel" aria-labelledby="mrH">
          <h2 className="panel-h" id="mrH">Most Read</h2>
          <ol className="mostread">
            {mostRead.map((a, idx) => (
              <li key={a.id}>
                <span className="rank">{String(idx + 1).padStart(2, "0")}</span>
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
      )}

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
        <Link href="/page/editorial-standards">Read our editorial standards →</Link>
      </div>

      <NewsletterSignup style={{ borderRadius: "var(--r-lg)" }} />
    </aside>
  );
}
