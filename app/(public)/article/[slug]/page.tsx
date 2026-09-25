import type { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getImgSrc, fmtViews, timeAgo } from "@/lib/utils";
import { db } from "@/lib/db";
import { getRecentArticleSlugs } from "@/lib/cached-queries";
import { ARTICLE_CARD_SELECT } from "@/lib/queries";
import { constructMetadata, generateNewsArticleJsonLd, siteConfig } from "@/lib/seo";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import TableOfContents from "@/components/article/TableOfContents";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";
import ViewCounter from "@/components/article/ViewCounter";
import ActiveCategorySetter from "@/components/layout/ActiveCategorySetter";

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
    type: "article",
    publishedTime: article.publishedAt ? article.publishedAt.toISOString() : article.createdAt.toISOString(),
    modifiedTime: article.updatedAt.toISOString(),
    authors: [article.author || "xSypher Staff"],
  });
}

// Cached and revalidated on a timer, rather than force-dynamic.
//
// force-dynamic meant every visitor triggered a fresh render and a fresh set of
// queries, and -- more importantly -- it made every revalidatePath() call in the
// workflow actions a no-op, because there was never a cached entry to
// invalidate. Publishing already calls revalidatePath for this route, so an
// editorial change still appears immediately; the window below is only the
// ceiling for anything that changes without an explicit revalidation, such as
// a view count.
export const revalidate = 300; // article

/**
 * Pre-render the most recent articles at build time.
 *
 * Bounded at 50 rather than the whole archive: build time would otherwise grow
 * with the number of published stories, and the long tail is not what readers
 * arrive on -- traffic to a news site concentrates hard on the last few days.
 *
 * Anything not in this list still works. Next renders it on first request and
 * caches the result from then on, so the only difference is who pays for that
 * first render. Leaving dynamicParams at its default (true) is what makes that
 * true; setting it false would 404 every older article.
 */
export async function generateStaticParams() {
  try {
    const recent = await getRecentArticleSlugs(50);
    return recent.map((a: { slug: string }) => ({ slug: a.slug }));
  } catch {
    // A build without a reachable database should still succeed. Returning an
    // empty list means every article renders on demand, which is exactly the
    // behaviour before this function existed.
    return [];
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await db.article.findUnique({ 
    where: { 
      slug, 
      status: "PUBLISHED",
    }, 
    include: { category: { include: { parent: true } }, authorModel: true, tags: true } 
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
  
  const mainCat = (article.category as any)?.parent;
  const subCat = mainCat ? article.category : null;
  const catName = mainCat?.name || article.category?.name || "News";
  const catSlug = mainCat?.slug || article.category?.slug || "news";
  
  const authorName = article.authorModel?.name || article.author || "xSypher Staff";
  const authorSlug = article.authorModel?.slug || null;
  const articleAuthorRole = article.authorModel?.role || article.role || "Contributing writer";

  const authorBio = article.authorModel?.overview || "Contributing writer for xSypher.";

  let socials: { platform: string; url: string }[] = [];
  try {
    const raw = article.authorModel?.socialLinks;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) socials = parsed.filter(s => s.url?.trim());
  } catch { socials = []; }

  // Related articles
  let relatedDb = await db.article.findMany({
    where: {
      tags: { some: { id: { in: article.tags.map(t => t.id) } } },
      id: { not: article.id },
      status: "PUBLISHED"
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
    select: ARTICLE_CARD_SELECT,
  });

  const mainCatId = mainCat ? mainCat.id : article.categoryId;

  if (relatedDb.length < 3) {
    const fallback = await db.article.findMany({
      where: {
        category: mainCatId ? {
          OR: [
            { id: mainCatId },
            { parentId: mainCatId }
          ]
        } : undefined,
        id: { notIn: [article.id, ...relatedDb.map(r => r.id)] },
        status: "PUBLISHED"
      },
      orderBy: { publishedAt: "desc" },
      take: 3 - relatedDb.length,
      select: ARTICLE_CARD_SELECT,
    });
    relatedDb = [...relatedDb, ...fallback];
  }
  
  const related = relatedDb.map(a => ({
    ...a,
    mins: 5,
    views: a.views,
    img: a.img || "",
    alt: a.title
  }));

  const discoverMoreDb = await db.article.findMany({
    where: {
      category: mainCatId ? {
        NOT: {
          OR: [
            { id: mainCatId },
            { parentId: mainCatId }
          ]
        }
      } : undefined,
      id: { notIn: [article.id, ...relatedDb.map(r => r.id)] },
      status: "PUBLISHED"
    },
    orderBy: { publishedAt: "desc" },
    take: 4,
    select: ARTICLE_CARD_SELECT,
  });

  const discoverMore = discoverMoreDb.map(a => ({
    ...a,
    mins: 5,
    views: a.views,
    img: a.img || "",
    alt: a.title
  }));

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://xsypher.com";
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      ...(mainCat ? [{
        "@type": "ListItem",
        "position": 2,
        "name": mainCat.name,
        "item": `${siteUrl}/category/${mainCat.slug}`
      }] : []),
      {
        "@type": "ListItem",
        "position": mainCat ? 3 : 2,
        "name": subCat ? subCat.name : catName,
        "item": `${siteUrl}/category/${subCat ? subCat.slug : catSlug}`
      },
      {
        "@type": "ListItem",
        "position": mainCat ? 4 : 3,
        "name": article.title,
        "item": `${siteUrl}/article/${article.slug}`
      }
    ]
  };

  return (
    <>
      <ActiveCategorySetter slug={catSlug} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateNewsArticleJsonLd(article)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProgressBar />
      <ViewCounter articleId={article.id} />
      <article className="art pb-16" itemScope itemType="https://schema.org/NewsArticle">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          
          {/* HEADER ROW */}
          <header className="mb-10 flex flex-col min-w-0 lg:col-start-2 lg:col-span-10 xl:col-start-2 xl:col-span-8">
              <nav className="crumb mb-6" aria-label="Breadcrumb">
                <Link href="/">Home</Link>
                <span className="sep">/</span>
                <Link href={`/category/${catSlug}`}>{catName}</Link>
                {subCat && (
                  <>
                    <span className="sep">/</span>
                    <Link href={`/category/${subCat.slug}`}>{subCat.name}</Link>
                  </>
                )}
                <span className="sep">/</span>
                <span aria-current="page">{article.title.length > 44 ? article.title.slice(0, 44) + "…" : article.title}</span>
              </nav>
              <Link className="kicker art-kicker" href={`/category/${catSlug}`}>
                {catName} {subCat && `/ ${subCat.name}`}
              </Link>
              <h1 className="art-title" itemProp="headline">{article.title}</h1>
              <p className="art-deck" itemProp="description">{article.deck}</p>
              
              <div className="py-4 my-6 border-t border-b border-[var(--line)]">
                <div className="flex items-center gap-3 mb-4">
                  {authorSlug ? (
                    <Link href={`/author/${authorSlug}`} className="shrink-0">
                      {article.authorModel?.avatar ? (
                        <Image src={article.authorModel.avatar} alt={authorName} width={40} height={40} className="w-10 h-10 rounded-full shrink-0 object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold shrink-0">{authorName.charAt(0)}</div>
                      )}
                    </Link>
                  ) : (
                    article.authorModel?.avatar ? (
                      <Image src={article.authorModel.avatar} alt={authorName} width={40} height={40} className="w-10 h-10 rounded-full shrink-0 object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold shrink-0">{authorName.charAt(0)}</div>
                    )
                  )}
                  <div className="flex flex-col justify-center flex-1 min-w-0">
                    {authorSlug ? (
                      <Link href={`/author/${authorSlug}`} className="text-sm font-bold text-[var(--ink)] hover:text-[var(--accent)] truncate" itemProp="author">{authorName}</Link>
                    ) : (
                      <span className="text-sm font-bold text-[var(--ink)] truncate" itemProp="author">{authorName}</span>
                    )}
                    <span className="text-xs text-[var(--muted)] whitespace-normal break-words">{articleAuthorRole}</span>
                  </div>
                </div>
                <div className="font-mono text-[11px] text-[var(--muted)] tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Published <b><time itemProp="datePublished" className="text-[var(--ink)]">{(article.publishedAt || article.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></b></span>
                  <span className="hidden sm:inline">·</span>
                  <span>Updated <b>{article.updatedAt.toLocaleDateString("en-US")}</b></span>
                  <span className="hidden sm:inline">·</span>
                  <span><b>{(article as any).readingTime || 1} min</b> read</span>
                  <span className="hidden sm:inline">·</span>
                  <span><b>{fmtViews(article.views)}</b> reads</span>
                </div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginTop: "14px", marginBottom: "32px" }}>
                <ListenButton />
                <a
                  href="#comments"
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold !text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm shrink-0"
                  aria-label="Jump to comments section"
                >
                  <MessageSquare className="w-3.5 h-3.5 !text-white"/>
                  <span>Comments</span>
                </a>
                <span className="muted" style={{ fontSize: "12px" }}>• {(article as any).readingTime || 1} min listen</span>
              </div>
              
              <figure className="art-hero mb-8">
                <div className="ph r-169 relative w-full overflow-hidden rounded-xl">
                  <Image 
                    src={getImgSrc(article.img || "", 1400, 788)} 
                    alt={article.title} 
                    fill 
                    priority 
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-xs text-[var(--muted)] mt-3">
                  {article.title}
                  <span className="credit block text-[10px] uppercase tracking-wider mt-1">Photo: xSypher illustration / Pexels</span>
                </figcaption>
              </figure>
            </header>

          {/* LEFT SIDEBAR (Socials, 1 col) */}
          <div className="hidden lg:block lg:col-start-1 lg:col-span-1">
            <div className="sticky top-32">
              <ArticleSidebar title={article.title} />
            </div>
          </div>

          {/* MAIN ARTICLE BODY & FOOTER */}
          <div className="lg:col-start-2 lg:col-span-10 xl:col-start-2 xl:col-span-8 flex flex-col min-w-0">
            <div className="prose min-w-0 max-w-none w-full" id="prose" itemProp="articleBody">
              <ArticleBody html={article.contentHtml} />
            </div>

            <div className="art-foot mt-12 pt-8 border-t border-[var(--line)]">
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
            <b>Fact-check & corrections:</b> This story was reported, edited and fact-checked by the xSypher desk. 
            If you spot an error, tell us via our <Link href="/page/corrections" style={{ textDecoration: "underline", color: "var(--accent)" }}>corrections page</Link> — we fix mistakes openly and note every material change.
          </span>
        </div>

        <section className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-4 sm:p-7 shadow-sm flex flex-col mt-12 mb-10" aria-label="About the author">
          <div className="flex items-center gap-3 sm:gap-4 mb-3">
            <div className="flex-shrink-0">
              {authorSlug ? (
                <Link href={`/author/${authorSlug}`} className="block">
                  {article.authorModel?.avatar ? (
                    <img src={article.authorModel.avatar} alt={authorName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm shrink-0 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]">{authorName.charAt(0)}</div>
                  )}
                </Link>
              ) : (
                article.authorModel?.avatar ? (
                  <img src={article.authorModel.avatar} alt={authorName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover shadow-sm shrink-0 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[var(--surface-3)] text-[var(--ink)] flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm shrink-0 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--surface)]">{authorName.charAt(0)}</div>
                )
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <span className="text-base font-bold sm:text-lg leading-tight truncate text-[var(--ink)]">
                {authorSlug ? (
                  <Link href={`/author/${authorSlug}`} className="hover:text-[var(--accent)] transition-colors">{authorName}</Link>
                ) : authorName}
              </span>
              <span className="text-[9px] sm:text-[11px] leading-snug line-clamp-2 mt-0.5 text-[var(--accent)] tracking-wider uppercase">
                {articleAuthorRole}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
            {article.authorModel?.overview || "Contributing writer at xSypher."}
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
        </section>

        <CommentsSection articleSlug={article.slug} />

        <section aria-label="Read Next" style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--f-ui)", fontSize: "16px", fontWeight: 700, letterSpacing: ".02em", marginBottom: "20px" }}>Read Next</h2>
          <div className="grid4">
            {related.map(a => (
              <StoryCard key={a.id} article={a} showDeck={false} />
            ))}
          </div>
        </section>

        <section aria-label="Discover More" style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid var(--line)" }}>
          <h2 style={{ fontFamily: "var(--f-ui)", fontSize: "16px", fontWeight: 700, letterSpacing: ".02em", marginBottom: "20px" }}>Discover More</h2>
          <div className="grid4">
            {discoverMore.map(a => (
              <StoryCard key={a.id} article={a} showDeck={false} />
            ))}
          </div>
        </section>
          </div>
        </div>

        {/* RIGHT SIDEBAR (TOC, 3 cols) */}
        <aside className="hidden xl:block xl:col-start-10 xl:col-span-3 shrink-0">
          <div className="sticky top-32 space-y-4">
            <TableOfContents containerSelector=".prose" />
          </div>
        </aside>

      </div>
      <ArticleMobileToolbar />
    </article>
  </>
  );
}
