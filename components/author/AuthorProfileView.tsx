import Link from "next/link";
import StoryCard from "@/components/article/StoryCard";
import Sidebar from "@/components/layout/Sidebar";
import { fmtViews } from "@/lib/utils";
import { sanitizeBioHtml } from "@/lib/sanitize";

export function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === 'x' || p === 'twitter') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  );
  if (p === 'linkedin') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
  );
  if (p === 'github') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
  );
  if (p === 'youtube') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  );
  if (p === 'instagram') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  );
  if (p === 'facebook') return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
  );
  // Website / default
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  );
}

export default function AuthorProfileView({ author, articles, socials, totalViews }: { author: any, articles: any[], socials: any[], totalViews: number }) {
  return (
    <div className="ap-root">
      {/* ── Hero / Banner ─────────────────────────── */}
      <section className="ap-hero">
        <div className="ap-banner" aria-hidden="true">
          <div className="ap-banner-grid" />
        </div>

        <div className="wrap ap-hero-inner">
          <div className="ap-avatar-wrap">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="ap-avatar" />
            ) : (
              <div className="ap-avatar ap-avatar-initial">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="ap-hero-info">
            <h1 className="ap-name" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {author.name}
              {author.verifiedTitle && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)" style={{ flexShrink: 0 }} aria-label="Verified Staff">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.9 14.7L6 12.6l1.5-1.5 2.6 2.6 6.4-6.4 1.5 1.5-7.9 7.9z" fill="#fff"/>
                  <circle cx="12" cy="12" r="10" fill="var(--accent)"/>
                  <path d="M10.1 16.7l-4.1-4.1 1.4-1.4 2.7 2.7 6.4-6.4 1.4 1.4-7.8 7.8z" fill="#fff"/>
                </svg>
              )}
            </h1>
            
            {/* Primary Credential (Headline / Tagline) */}
            {author.headline && (
              <p className="ap-headline" style={{ color: "var(--ink-2)", fontWeight: 500 }}>
                {author.headline}
              </p>
            )}

            <div className="ap-meta-row" style={{ marginTop: "12px" }}>
              {author.location && (
                <span className="ap-meta-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {author.location}
                </span>
              )}
              {author.email && author.publicContact !== false && (
                <a href={`mailto:${author.email}`} className="ap-meta-item ap-meta-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                  {author.email}
                </a>
              )}
              {author.website && (
                <a href={author.website} target="_blank" rel="noopener noreferrer" className="ap-meta-item ap-meta-link">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                  {author.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Social icons */}
            {socials.length > 0 && (
              <div className="ap-socials" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "16px" }}>
                {socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full border border-[var(--line)] text-xs font-medium text-[var(--ink-2)] hover:bg-[var(--surface-2)] transition-colors"
                    aria-label={s.platform}
                    title={s.platform}
                  >
                    <SocialIcon platform={s.platform} />
                    <span>{s.platform}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Stats Row ─────────────────────────────── */}
      <div className="ap-stats-bar">
        <div className="wrap ap-stats-inner">
          <div className="ap-stat">
            <span className="ap-stat-val">{articles.length}</span>
            <span className="ap-stat-label">Published Articles</span>
          </div>
          <div className="ap-stat-divider" />
          <div className="ap-stat">
            {totalViews >= 1000 ? (
              <>
                <span className="ap-stat-val">{fmtViews(totalViews)}</span>
                <span className="ap-stat-label">Total Reads</span>
              </>
            ) : (
              <>
                <span className="ap-stat-val">
                  {articles.length > 0
                    ? `~${Math.round(articles.reduce((sum, a) => sum + (a.mins || 5), 0) / articles.length)} mins`
                    : "--"}
                </span>
                <span className="ap-stat-label">Avg. Read Time</span>
              </>
            )}
          </div>
          <div className="ap-stat-divider" />
          <div className="ap-stat">
            <span className="ap-stat-val">{new Date(author.joinedAt || Date.now()).getFullYear()}</span>
            <span className="ap-stat-label">Joined xSypher</span>
          </div>
        </div>
      </div>

      {/* ── Body: About + Articles + Sidebar ─────────── */}
      <div className="wrap ap-body">
        
        <div className="ap-main-col">
          {/* About */}
          {author.bio && (
            <section className="ap-about" aria-label="About">
              <div className="ap-section-label">About</div>
              {author.expertise && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {author.expertise.split(',').map((beat: string, idx: number) => {
                      const trimmed = beat.trim();
                      if (!trimmed) return null;
                      return (
                        <span 
                          key={idx} 
                          className="bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink-2)] border border-[var(--line-2)] px-3 py-1.5 rounded-md text-xs font-mono tracking-wide transition-all cursor-default"
                        >
                          {trimmed}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="ap-bio prose" dangerouslySetInnerHTML={{ __html: sanitizeBioHtml(author.bio) }} />
              {author.disclosure && (
                <div style={{ marginTop: "16px", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--r-md)", fontSize: "13px", fontStyle: "italic", color: "var(--ink-muted)" }}>
                  <strong>Disclosure: </strong> {author.disclosure}
                </div>
              )}
            </section>
          )}

          {/* Articles */}
          <section aria-label="Articles" style={{ marginTop: author.bio ? '48px' : '32px' }}>
            <div className="ap-section-label" style={{ marginBottom: '24px' }}>
              {articles.length > 0
                ? `${articles.length} Article${articles.length !== 1 ? 's' : ''} by ${author.name}`
                : `Articles by ${author.name}`}
            </div>

            {articles.length > 0 ? (
              <div className="ap-articles-grid">
                {/* Featured first article */}
                {articles[0] && (
                  <article className="ap-article-featured">
                    {articles[0].img && (
                      <Link href={`/article/${articles[0].slug}`} className="ap-featured-img-wrap" tabIndex={-1} aria-hidden="true">
                        <img src={articles[0].img} alt={articles[0].title} className="ap-featured-img" />
                        <div className="ap-featured-img-overlay" />
                      </Link>
                    )}
                    <div className="ap-featured-body">
                      {articles[0].category && (
                        <Link href={`/category/${articles[0].category.slug}`} className="kicker" style={{ marginBottom: '10px', display: 'inline-block' }}>
                          {articles[0].category.name}
                        </Link>
                      )}
                      <h2 className="ap-featured-title">
                        <Link href={`/article/${articles[0].slug}`}>{articles[0].title}</Link>
                      </h2>
                      {articles[0].deck && <p className="ap-featured-deck">{articles[0].deck}</p>}
                      <div className="ap-article-meta">
                        {new Date(articles[0].createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {articles[0].views > 0 && ` · ${fmtViews(articles[0].views)} reads`}
                      </div>
                    </div>
                  </article>
                )}

                {/* Remaining articles grid */}
                {articles.length > 1 && (
                  <div className="ap-articles-rest">
                    {articles.slice(1).map(article => (
                      <StoryCard key={article.id} article={article} showDeck={false} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="ap-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <p>No published articles yet.</p>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <Sidebar />

      </div>
    </div>
  );
}
