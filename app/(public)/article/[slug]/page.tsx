import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getImgSrc, fmtViews, timeAgo } from "@/lib/utils";
import { db } from "@/lib/db";
import { constructMetadata, generateNewsArticleJsonLd } from "@/lib/seo";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({ 
    where: { 
      slug, 
      status: "PUBLISHED",
    } 
  });

  if (!article) {
    const historicalArticle = await db.article.findFirst({
      where: { previousSlugs: { has: slug }, status: "PUBLISHED" }
    });
    if (historicalArticle) return {};
    return {};
  }

  if (article.publishedAt && article.publishedAt > new Date()) return {};
  
  return constructMetadata({
    title: article.seoTitle || article.title,
    description: article.seoDesc || article.deck || "",
    image: article.img ? getImgSrc(article.img, 1200, 630) : undefined,
    canonical: `/article/${article.slug}`,
  });
}

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let article = await db.article.findUnique({ 
    where: { 
      slug, 
      status: "PUBLISHED",
    }, 
    include: { category: true, authorModel: true, tags: true } 
  });
  
  if (!article) {
    const historicalArticle = await db.article.findFirst({
      where: { previousSlugs: { has: slug }, status: "PUBLISHED" }
    });
    if (historicalArticle) {
      redirect(`/article/${historicalArticle.slug}`);
    }
    notFound();
  }

  if (article.publishedAt && article.publishedAt > new Date()) {
    notFound();
  }
  
  const catName = article.category?.name || "News";
  const catSlug = article.category?.slug || "news";
  
  const authorName = article.authorModel?.name || article.author || "xCipher Staff";
  const authorSlug = article.authorModel?.slug || null;
  const articleAuthorRole = article.authorModel?.role || article.role || "Contributing writer";

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

  // Related articles
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateNewsArticleJsonLd(article)) }}
      />
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
            <span className="muted">{articleAuthorRole}</span>
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

        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row gap-6 mt-12 mb-10" aria-label="About the author">
          <div className="flex-shrink-0">
            {authorSlug ? (
              <Link href={`/author/${authorSlug}`} className="block">
                {article.authorModel?.avatar ? (
                  <img src={article.authorModel.avatar} alt={authorName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[var(--line)] shadow-sm shrink-0" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold text-xl sm:text-2xl border-2 border-[var(--line)] shadow-sm shrink-0">{authorName.charAt(0)}</div>
                )}
              </Link>
            ) : (
              article.authorModel?.avatar ? (
                <img src={article.authorModel.avatar} alt={authorName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-[var(--line)] shadow-sm shrink-0" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold text-xl sm:text-2xl border-2 border-[var(--line)] shadow-sm shrink-0">{authorName.charAt(0)}</div>
              )
            )}
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col mb-2">
              <span className="text-lg sm:text-xl font-bold text-[var(--ink)] tracking-tight">
                {authorSlug ? (
                  <Link href={`/author/${authorSlug}`} className="hover:text-[var(--accent)] transition-colors">{authorName}</Link>
                ) : authorName}
              </span>
              <span className="inline-block mt-0.5 text-xs font-semibold text-[var(--accent)] tracking-wider uppercase">
                {articleAuthorRole}
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] leading-relaxed mt-2.5 max-w-2xl">
              {article.authorModel?.overview || "Contributing writer at xCipher."}
            </p>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--line)]/50">
              <div className="flex items-center gap-1.5">
                {socials.map((s, i) => (
                  <Link key={i} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`${authorName} on ${s.platform}`} className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-2)] transition-colors">
                    <SocialIcon platform={s.platform} />
                  </Link>
                ))}
              </div>
              {authorSlug && (
                <Link href={`/author/${authorSlug}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ink)] hover:text-[var(--accent)] transition-colors group">
                  View all articles 
                  <span aria-hidden="true" className="group-hover:translate-x-1 transition-transform duration-150">→</span>
                </Link>
              )}
            </div>
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
