import Image from "next/image";
import Link from "next/link";
import { getImgSrc, fmtViews } from "@/lib/utils";
import RelativeTime from "@/components/common/RelativeTime";
import { getHomeArticles } from "@/lib/cached-queries";
import { db } from "@/lib/db";
import StoryCard from "@/components/article/StoryCard";
import StoryRow from "@/components/article/StoryRow";
import BreakingTicker from "@/components/home/BreakingTicker";
import EditorialTicker from "@/components/home/EditorialTicker";
import NewsletterSignup from "@/components/newsletter/NewsletterSignup";

// Cached and revalidated on a timer, rather than force-dynamic.
//
// force-dynamic meant every visitor triggered a fresh render and a fresh set of
// queries, and -- more importantly -- it made every revalidatePath() call in the
// workflow actions a no-op, because there was never a cached entry to
// invalidate. Publishing already calls revalidatePath for this route, so an
// editorial change still appears immediately; the window below is only the
// ceiling for anything that changes without an explicit revalidation, such as
// a view count.
export const revalidate = 300; // homepage

export default async function Home() {
  // Tagged read: publishing invalidates the `articles` tag, which drops this
  // entry and nothing else. Previously the same event dropped every cached
  // route in the app.
  const dbArticles = await getHomeArticles();

  if (!dbArticles.length) return <div className="wrap py-20 text-center">No articles published yet.</div>;

  // homepagePlacement decides these, not array position.
  //
  // Previously `breaking` was `i === 1 || i === 2` and `pick` was
  // `i === 0 || i === 3` -- the second and third newest articles were
  // "breaking" purely by virtue of being second and third. Meanwhile the
  // editor has offered a Homepage Placement select (Hero / Featured Stories /
  // Editor's Picks) all along, the save action wrote it and the query selected
  // it, and absolutely nothing read it. Editors were setting a control that
  // did nothing, which is worse than not offering the control.
  //
  // Each section falls back to recency when no article carries that placement,
  // so a newsroom that never touches the field sees the homepage it saw
  // before.
  const mappedArticles = dbArticles.map((a) => ({
    ...a,
    // No Date.now() here: this page is cached for 300s, so a relative age
    // computed at render time is frozen into the cached HTML and served stale
    // to everyone in that window. The absolute createdAt is passed through and
    // <RelativeTime> does the arithmetic in the browser.
    age: 0,
    mins: 5,
    alt: a.title,
    breaking: a.homepagePlacement === "featured",
    pick: a.homepagePlacement === "picks",
  }));

  // Hero: an explicit hero placement wins, then the legacy `featured` flag,
  // then the newest story.
  const lead =
    mappedArticles.find((a) => a.homepagePlacement === "hero") ||
    mappedArticles.find((a) => a.featured) ||
    mappedArticles[0];

  // Featured strip: explicitly placed stories, topped up with recent ones if
  // fewer than four are placed, so the row never renders half-empty.
  const placedBriefing = mappedArticles.filter((a) => a.breaking && a.slug !== lead.slug);
  const briefing = [
    ...placedBriefing,
    ...mappedArticles.filter(
      (a) => a.slug !== lead.slug && !placedBriefing.some((p) => p.slug === a.slug)
    ),
  ].slice(0, 4);

  const latest = mappedArticles.filter((a) => a.slug !== lead.slug).slice(0, 7);
  
  const byCat = (slug: string) => mappedArticles.filter(a => a.category?.slug === slug);
  const gd = byCat("gadgets");
  const gm = byCat("gaming");
  
  const topCategories = await db.category.findMany({
    where: { articles: { some: { status: 'PUBLISHED' } } },
    orderBy: { articles: { _count: 'desc' } },
    take: 4,
  });
  
  const mostRead = [...mappedArticles].sort((a, b) => b.views - a.views).slice(0, 5).map((a, i) => ({ ...a, most: i + 1 }));
  const trending = mostRead.map((a, i) => ({ ...a, trend: i + 1 }));
  // Same top-up rule as the featured strip: placement first, recency to fill.
  const placedPicks = mappedArticles.filter((a) => a.pick);
  const picks =
    placedPicks.length >= 4
      ? placedPicks
      : [
          ...placedPicks,
          ...mappedArticles.filter(
            (a) => a.slug !== lead.slug && !placedPicks.some((p) => p.slug === a.slug)
          ),
        ].slice(0, 4);
  const pickFeat = picks[0];
  const pickRest = picks.slice(1, 4);

  return (
    <>
      {/* Uses the topped-up briefing list rather than the raw placement
          filter: BreakingTicker returns null on an empty array, so keying it
          off placement alone would make the ticker disappear entirely on any
          site that has not set the field. */}
      <BreakingTicker articles={briefing} />
      
      {/* Top Ad */}
      <div className="ad-wrap">
        <div className="ad-label">Advertisement</div>
        <div className="ad-slot ad-leaderboard" data-ad-location="top" data-size="728 × 90" role="complementary" aria-label="Advertisement placement"></div>
      </div>

      {/* Lead Story & Briefing */}
      <section className="lead-grid wrap" aria-label="Lead story">
        <article className="lead-story story">
          <Link href={`/article/${lead.slug}`} className="ph r-169" tabIndex={-1} aria-hidden="true">
              <Image 
                src={getImgSrc(lead.img || "", 1280, 720)} 
                alt={lead.alt || lead.title} 
                fill
                priority 
                className="object-cover"
              />
          </Link>
          <Link href={`/category/${lead.category?.slug || "news"}`} className="kicker">
            {lead.category?.name || "News"}
          </Link>
          <h1>
            <Link href={`/article/${lead.slug}`}>
              <span className="hlink">{lead.title}</span>
            </Link>
          </h1>
          <p className="story-deck">{lead.deck}</p>
          <div className="byline">
            {lead.authorModel?.avatar ? (
              <img src={lead.authorModel.avatar} alt={lead.authorModel.name || lead.author || ""} className="ava lg object-cover rounded-full" />
            ) : (
              <div className="ava lg">{(lead.author || "xSypher").charAt(0)}</div>
            )}
            <span>
              <b>{lead.author || "xSypher Staff"}</b>, {lead.role || ""} <span className="dot">·</span> {<RelativeTime dateTime={new Date(lead.createdAt).toISOString()} />} <span className="dot">·</span> {lead.mins} min read
            </span>
          </div>
        </article>
        
        <aside className="briefing" aria-label="The briefing">
          <div className="briefing-title">
            <h2>The Briefing</h2>
            <span>Updated {briefing[0]?.createdAt ? <RelativeTime dateTime={new Date(briefing[0].createdAt).toISOString()} /> : null}</span>
          </div>
          {briefing.map(a => (
            <StoryRow key={a.id} article={a} showDeck={false} />
          ))}
        </aside>
      </section>

      {/* Latest & Sidebar */}
      <div className="wrap feed-grid">
        <section aria-labelledby="latestH">
          <div className="sec-head" style={{ marginTop: "8px" }}>
            <h2 id="latestH">
              <span className="sec-rule"></span>Latest<span className="sec-sub">Every story, newest first</span>
            </h2>
            <Link href="/latest" className="view-all">
              View all 
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
          {latest.map(a => (
            <StoryRow key={a.id} article={a} />
          ))}
        </section>

        <aside className="side-col" aria-label="Sidebar">
          {/* Most Read */}
          <section className="panel" aria-labelledby="mrH">
            <h2 className="panel-h" id="mrH">Most Read</h2>
            <ol className="mostread">
              {mostRead.map(a => (
                <li key={a.id}>
                  <span className="rank">{String(a.most).padStart(2, "0")}</span>
                  <div>
                    <h3>
                      <Link href={`/article/${a.slug}`}>
                        <span className="hlink">{a.title}</span>
                      </Link>
                    </h3>
                    <span className="mr-cat">{a.category?.name || "News"} · {fmtViews(a.views)} reads</span>
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
            <p>xSypher stories are reported, fact-checked and edited before publication. We correct errors openly and label opinion clearly. We buy our own review units and accept no payment for coverage.</p>
            <Link href="/page/editorial-standards">Read our editorial standards →</Link>
          </div>
        </aside>
      </div>

      {/* Ad */}
      <div className="ad-wrap">
        <div className="ad-label">Advertisement</div>
        <div className="ad-slot ad-billboard" data-ad-location="between-sections" data-size="970 × 250" role="complementary" aria-label="Advertisement placement"></div>
      </div>

      {/* Dynamic Cat Split 1 & 2 */}
      {topCategories[0] && <CatSplit cat={topCategories[0].slug} articles={byCat(topCategories[0].slug)} />}
      
      {topCategories[1] && <CatSplit cat={topCategories[1].slug} articles={byCat(topCategories[1].slug)} reverse />}

      {/* Ad */}
      <div className="ad-wrap">
        <div className="ad-label">Advertisement</div>
        <div className="ad-slot ad-leaderboard" data-ad-location="mid-feed" data-size="728 × 90" role="complementary" aria-label="Advertisement placement"></div>
      </div>

      {/* Gadgets Grid */}
      <section aria-label="Gadgets & Devices">
        <div className="wrap">
          <div className="sec-head">
            <h2><span className="sec-rule"></span>Gadgets & Devices</h2>
            <Link href="/category/gadgets" className="view-all">
              View all 
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="grid4">
            {gd.slice(0, 4).map(a => (
              <StoryCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Cat Split 3 */}
      {topCategories[2] && <CatSplit cat={topCategories[2].slug} articles={byCat(topCategories[2].slug)} reverse />}

      {/* Gaming Band */}
      <section className="band" aria-label="Gaming">
        <div>
          <div className="sec-head">
            <h2><span className="sec-rule"></span>Gaming</h2>
            <Link href="/category/gaming" className="view-all">
              View all 
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="band-grid">
            {gm.slice(0, 3).map(a => (
              <StoryCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Cat Split 4 */}
      {topCategories[3] && <CatSplit cat={topCategories[3].slug} articles={byCat(topCategories[3].slug)} />}

      {/* Trending */}
      <div className="trend-wrap">
        <div className="wrap">
          <div className="sec-head">
            <h2><span className="sec-rule"></span>Trending on xSypher</h2>
            <Link href="/latest" className="view-all">
              All stories 
              <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="trend-grid">
            {trending.map(a => (
              <article key={a.id} className="trend" data-reveal>
                <span className="num">{String(a.trend).padStart(2, "0")}</span>
                <Link className="tr-cat" href={`/category/${a.category?.slug || "news"}`}>{a.category?.name || "News"}</Link>
                <h3>
                  <Link href={`/article/${a.slug}`}>
                    <span className="hlink">{a.title}</span>
                  </Link>
                </h3>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Editor's Picks */}
      <section className="wrap" aria-label="Editors picks">
        <div className="picks" data-reveal>
          <div className="picks-in">
            {pickFeat && (
              <article className="pick-feat story">
                <span className="pick-badge">
                  <svg className="ic-s" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.6 6.6L21 9.3l-5 4.4 1.5 6.8L12 16.9 6.5 20.5 8 13.7 3 9.3l6.4-.7L12 2z"/>
                  </svg>
                  Editor's Pick
                </span>
                <Link href={`/article/${pickFeat.slug}`} className="ph r-169" style={{ marginTop: "14px" }} tabIndex={-1} aria-hidden="true">
                  <Image 
                    src={getImgSrc(pickFeat.img || "", 900, 506)} 
                    alt={pickFeat.alt || pickFeat.title} 
                    fill 
                    className="object-cover"
                  />
                </Link>
                <Link href={`/category/${pickFeat.category?.slug || "news"}`} className="kicker" style={{ marginTop: "16px" }}>
                  {pickFeat.category?.name || "News"}
                </Link>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--ink)] leading-tight mb-2">
                  <Link href={`/article/${pickFeat.slug}`}>
                    <span className="hlink">{pickFeat.title}</span>
                  </Link>
                </h3>
                <p className="story-deck">{pickFeat.deck}</p>
                <div className="byline">
                  {pickFeat.authorModel?.avatar ? (
                    <img src={pickFeat.authorModel.avatar} alt={pickFeat.authorModel.name || pickFeat.author || ""} className="ava object-cover rounded-full" />
                  ) : (
                    <div className="ava">{(pickFeat.author || "xSypher").charAt(0)}</div>
                  )}
                  <span><b>{pickFeat.author || "xSypher Staff"}</b> <span className="dot">·</span> {<RelativeTime dateTime={new Date(pickFeat.createdAt).toISOString()} />}</span>
                </div>
              </article>
            )}
            <div className="pick-side">
              {pickRest.map(a => (
                <StoryCard key={a.id} article={a} showDeck={false} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <div className="wrap">
        <NewsletterSignup />
      </div>
    </>
  );
}

// Inline helper component for Cat Split sections
function CatSplit({ cat, articles, reverse = false }: { cat: string, articles: any[], reverse?: boolean }) {
  const feat = articles[0];
  const rest = articles.slice(1, 4);
  const c = { name: feat?.category?.name || cat };

  if (!feat) return null;

  return (
    <section aria-label={c.name}>
      <div className="wrap">
        <div className="sec-head">
          <h2>
            <span className="sec-rule"></span>{c.name}
            {cat === "business" && <span className="sec-sub">Markets · Funding · Strategy</span>}
          </h2>
          <Link href={`/category/${cat}`} className="view-all">
            View all 
            <svg className="ic-s" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </Link>
        </div>
        
        {cat === "business" && (
          <EditorialTicker articles={articles.slice(0, 8)} />
        )}

        <div className={`cat-split${reverse ? " rev" : ""}`}>
          <article className="cat-feat story" data-reveal>
            <Link href={`/article/${feat.slug}`} className="ph r-169" tabIndex={-1} aria-hidden="true">
              <Image 
                src={getImgSrc(feat.img || "", 960, 540)} 
                alt={feat.alt || feat.title} 
                fill 
                className="object-cover"
              />
            </Link>
            <div>
              <Link href={`/category/${cat}`} className="kicker plain">
                {c.name}
              </Link>
              <h3>
                <Link href={`/article/${feat.slug}`}>
                  <span className="hlink">{feat.title}</span>
                </Link>
              </h3>
              <p className="story-deck">{feat.deck}</p>
              <div className="byline" style={{ marginTop: "12px" }}>
                {feat.authorModel?.avatar ? (
                  <img src={feat.authorModel.avatar} alt={feat.authorModel.name || feat.author || ""} className="ava sm object-cover rounded-full" />
                ) : (
                  <div className="ava sm">{feat.author.charAt(0)}</div>
                )}
                <span><b>{feat.author}</b> <span className="dot">·</span> {<RelativeTime dateTime={new Date(feat.createdAt).toISOString()} />} <span className="dot">·</span> {feat.mins} min read</span>
              </div>
            </div>
          </article>
          
          <div className="cat-side">
            {rest.map(x => (
              <StoryRow key={x.id} article={x} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
