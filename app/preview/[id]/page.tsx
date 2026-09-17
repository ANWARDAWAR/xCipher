import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getImgSrc, fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canViewReviewQueue } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
  if (!article) return {};
  
  return {
    title: `Preview: ${article.title} — xCipher`,
    description: article.deck || "",
    robots: {
      index: false,
      follow: false,
      nocache: true
    }
  };
}

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: Props) {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id }, include: { category: true, authorModel: true, tags: true } });
  
  if (!article) {
    notFound();
  }

  // Authorization check
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="cs-card" style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <h2>Preview Access Denied</h2>
        <p style={{ color: "var(--muted)", marginTop: "1rem" }}>You must be logged in to preview articles.</p>
        <Link href="/admin/login" className="btn-cs" style={{ marginTop: "1.5rem", display: "inline-block" }}>Log In</Link>
      </div>
    );
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } });
  
  const canEdit = canEditArticle({ id: user.id, role: user.role, authorId: dbUser?.authorProfile?.id }, article).success;
  const canReview = canViewReviewQueue(user.role as Role);

  if (!canEdit && !canReview) {
    return (
      <div className="cs-card" style={{ maxWidth: "600px", margin: "4rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <h2>Preview Forbidden</h2>
        <p style={{ color: "var(--muted)", marginTop: "1rem" }}>You do not have permission to preview this article.</p>
        <Link href="/admin" className="btn-cs" style={{ marginTop: "1.5rem", display: "inline-block" }}>Return to Dashboard</Link>
      </div>
    );
  }
  
  const catName = article.category?.name || "News";
  const catSlug = article.category?.slug || "news";
  
  const authorName = article.authorModel?.name || article.author || "xCipher Staff";
  const authorSlug = article.authorModel?.slug || null;
  const authorHeadline = article.authorModel?.headline || article.role || "Contributing writer";

  // Author bio mapping
  const bios: Record<string, string> = { 
    "Ahmed Khan": "Writing about artificial intelligence, cybersecurity, software and the technology industry.", 
    "Elena Vasquez": "Covering breaches, privacy and the people who defend the network. Twelve years in security journalism.", 
    "Priya Sharma": "Senior correspondent on AI platforms, operating systems and the software industry.", 
    "Daniel Okafor": "Gadgets editor. Reviews and reports on the hardware that carries our digital lives.", 
    "Marcus Webb": "Programming editor — languages, frameworks, cloud and open source.", 
    "Hana Yoshida": "Business correspondent covering startups, funding and tech markets.", 
    "Tom Becker": "Gaming editor. Covers games, hardware and the industry seriously.", 
    "Aisha Bello": "Reviews editor. Runs the xCipher test lab; buys every unit we review.", 
    "Nadia Osei": "How-to editor. Practical guides, tested before they're published.", 
    "James Whitfield": "Opinion columnist on platforms, policy and the economics of software.", 
    "Liam Turner": "Staff writer across science, future tech and the wider xCipher desk." 
  };
  const authorBio = (article.author && bios[article.author]) || "Contributing writer at xCipher.";

  let socials: { platform: string; url: string }[] = [];
  try {
    const raw = article.authorModel?.socialLinks;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) socials = parsed.filter(s => s.url?.trim());
  } catch { socials = []; }

  // Related articles (mocked or fetched real ones)
  const relatedDb = await db.article.findMany({
    where: { categoryId: article.categoryId, id: { not: article.id }, status: "PUBLISHED" },
    take: 3,
    include: { category: true }
  });
  
  const related = relatedDb.map(a => ({
    ...a,
    mins: 5,
    views: a.views,
    img: a.img || "",
    alt: a.title
  }));

  return (
    <>
      <div style={{
        background: "var(--surface-3, #262c32)",
        borderBottom: "1px solid var(--line, #31383f)",
        color: "#f59e0b",
        padding: "10px 24px",
        fontSize: "13.5px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 9999
      }} aria-label="Preview Banner">
        <span>⚠️ Story Preview Mode ({article.status}) — This story is not live on the public index.</span>
        <Link href={`/admin/editor/${article.id}`} style={{ color: "var(--accent, #f04552)", textDecoration: "underline" }}>
          Edit in Console →
        </Link>
      </div>
      <ProgressBar />
      <article className="art" itemScope itemType="https://schema.org/NewsArticle">
      <header className="wrap art-head">
        <nav className="crumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <Link href={`/category/${catSlug}`}>{catName}</Link>
          <span className="sep">/</span>
          <span aria-current="page">{article.title.length > 44 ? article.title.slice(0, 44) + "…" : article.title}</span>
        </nav>
        <Link className="kicker art-kicker" href={`/category/${catSlug}`}>
          {catName}
        </Link>
        <h1 className="art-title" itemProp="headline">{article.title}</h1>
        <p className="art-deck" itemProp="description">{article.deck}</p>
        
        <div className="art-byline">
          {authorSlug ? (
            <Link href={`/author/${authorSlug}`} style={{ flexShrink: 0, display: 'block' }}>
              {article.authorModel?.avatar ? (
                <img src={article.authorModel.avatar} alt={authorName} className="ava lg object-cover" />
              ) : (
                <div className="ava lg">{authorName.charAt(0)}</div>
              )}
            </Link>
          ) : (
            article.authorModel?.avatar ? (
              <img src={article.authorModel.avatar} alt={authorName} className="ava lg object-cover" />
            ) : (
              <div className="ava lg">{authorName.charAt(0)}</div>
            )
          )}
          <div className="ab-txt">
            {authorSlug ? (
              <Link href={`/author/${authorSlug}`} style={{ fontWeight: 700, color: 'inherit', textDecoration: 'none' }} itemProp="author">{authorName}</Link>
            ) : (
              <b itemProp="author">{authorName}</b>
            )}<br/>
            <span className="muted">{authorHeadline}</span>
          </div>
          <div className="ab-meta" style={{ marginLeft: "auto", textAlign: "right" }}>
            Published <b><time itemProp="datePublished">{article.createdAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></b><br/>
            Updated {article.updatedAt.toLocaleDateString("en-US")} · 5 min read · {fmtViews(article.views)} reads
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "14px" }}>
          <ListenButton />
          <span className="muted" style={{ fontSize: "12px" }}>≈ 5 minutes · narrated by xCipher</span>
        </div>
        
        <figure className="art-hero">
          <div className="ph r-169 relative w-full overflow-hidden">
            <Image 
              src={getImgSrc(article.img || "", 1400, 788)} 
              alt={article.title} 
              fill 
              priority 
              className="object-cover"
            />
          </div>
          <figcaption>
            {article.title}
            <span className="credit">Photo: xCipher illustration / Pexels</span>
          </figcaption>
        </figure>
      </header>

      <div className="wrap art-cols">
        <ArticleSidebar title={article.title} />
        <div className="prose" id="prose" itemProp="articleBody">
          <ArticleBody html={article.contentHtml} />
        </div>
      </div>

      <div className="wrap art-foot">
        <div className="tag-row">
          {(article.tags || []).map(t => (
            <Link key={t.id} className="chip" href={`/tag/${t.slug}`}>
              {t.name}
            </Link>
          ))}
        </div>
        
        <div className="fact-note">
          <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 12l2 2 4-4"/>
            <circle cx="12" cy="12" r="9"/>
          </svg>
          <span>
            <b>Fact-check & corrections:</b> This story was reported, edited and fact-checked by the xCipher desk. 
            If you spot an error, tell us via our <Link href="/page/corrections" style={{ textDecoration: "underline", color: "var(--accent)" }}>corrections page</Link> — we fix mistakes openly and note every material change.
          </span>
        </div>

        <section className="author-card" aria-label="About the author">
          {authorSlug ? (
            <Link href={`/author/${authorSlug}`} style={{ flexShrink: 0, display: 'block' }}>
              {article.authorModel?.avatar ? (
                <img src={article.authorModel.avatar} alt={authorName} className="ava lg object-cover" />
              ) : (
                <div className="ava lg">{authorName.charAt(0)}</div>
              )}
            </Link>
          ) : (
            article.authorModel?.avatar ? (
              <img src={article.authorModel.avatar} alt={authorName} className="ava lg object-cover" />
            ) : (
              <div className="ava lg">{authorName.charAt(0)}</div>
            )
          )}
          <div>
            <h4>
              {authorSlug ? (
                <Link href={`/author/${authorSlug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{authorName}</Link>
              ) : authorName}
            </h4>
            <div className="ar">{authorHeadline}</div>
            <p>{article.authorModel?.overview || authorBio}</p>
            {socials.length > 0 && (
              <div className="al">
                {socials.map((s, i) => (
                  <Link key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${authorName} on ${s.platform}`}>
                    <SocialIcon platform={s.platform} />
                  </Link>
                ))}
              </div>
            )}
            <Link href={`/category/${catSlug}`} style={{ font: "600 12px var(--f-ui)", color: "var(--accent)", display: "inline-block", marginTop: "10px" }}>
              View all articles →
            </Link>
          </div>
        </section>

        <CommentsSection articleSlug={article.slug} />

        <section aria-label="Continue reading" style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--f-ui)", fontSize: "16px", fontWeight: 700, letterSpacing: ".02em", marginBottom: "20px" }}>Continue reading</h2>
          <div className="grid4">
            {related.map(a => (
              <StoryCard key={a.id} article={a} showDeck={false} />
            ))}
          </div>
        </section>
      </div>
      <ArticleMobileToolbar />
    </article>
  </>
  );
}
