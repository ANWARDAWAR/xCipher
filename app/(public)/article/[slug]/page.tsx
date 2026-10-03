import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getImgSrc } from "@/lib/utils";
import { db } from "@/lib/db";
import { getArticleRecommendations, getBenchmarkLeaderboard } from "@/lib/cached-queries";
import { eq, and, sql } from "drizzle-orm";
import { article as articleTable } from "@/lib/db/schema";
import { constructMetadata, generateNewsArticleJsonLd } from "@/lib/seo";
import { getArticleAuthor } from "@/lib/personas";
import { serializeJsonLd, withEditorialSchema } from "@/lib/article-schema";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import TableOfContents from "@/components/article/TableOfContents";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import { fetchFromR2 } from "@/lib/storage";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";
import ViewCounter from "@/components/article/ViewCounter";
import ActiveCategorySetter from "@/components/layout/ActiveCategorySetter";
import ShareRow from "@/components/article/ShareRow";
import ArticleByline from "@/components/article/ArticleByline";
import AuthorBox from "@/components/article/AuthorBox";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [article] = await db.query.article.findMany({ 
    where: and(eq(articleTable.slug, slug), eq(articleTable.status, "PUBLISHED")),
    limit: 1,
    with: { category: { with: { parent: true } }, authorModel: { columns: { name: true, slug: true } } },
  });

  if (!article) {
    const [historicalArticle] = await db.query.article.findMany({
      where: and(
        sql`${slug} = ANY(${articleTable.previousSlugs})`,
        eq(articleTable.status, "PUBLISHED")
      ),
      limit: 1
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
    authors: [getArticleAuthor(article).name],
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



export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const [article] = await db.query.article.findMany({ 
    where: and(eq(articleTable.slug, slug), eq(articleTable.status, "PUBLISHED")),
    limit: 1,
    columns: {
      id: true, slug: true, title: true, deck: true, img: true, featuredImageAlt: true, featuredImageCaption: true, featuredImageCredit: true, author: true, role: true, views: true,
      status: true, createdAt: true, publishedAt: true, updatedAt: true, categoryId: true, contentUrl: true, isAnonymous: true
    },
    with: { category: { with: { parent: true } }, authorModel: true, tags: { with: { tag: true } } } 
  });
  
  if (!article) {
    const [historicalArticle] = await db.query.article.findMany({
      where: and(sql`${slug} = ANY(${articleTable.previousSlugs})`, eq(articleTable.status, "PUBLISHED")),
      limit: 1
    });
    if (historicalArticle) {
      redirect(`/article/${historicalArticle.slug}`);
    }
    notFound();
  }

  if (article.publishedAt && article.publishedAt > new Date()) {
    notFound();
  }
  
  const mainCat = article.category?.parent;
  const subCat = mainCat ? article.category : null;
  const catName = mainCat?.name || article.category?.name || "News";
  const catSlug = mainCat?.slug || article.category?.slug || "news";
  // Independent content and auxiliary reads can run concurrently.
  const [r2Content, globalLeaderboard, { related: relatedDb, discoverMore: discoverMoreDb }] = await Promise.all([
    fetchFromR2(article.contentUrl),
    getBenchmarkLeaderboard(),
    getArticleRecommendations(article.id, article.tags.map(tag => tag.B), mainCat?.id ?? article.categoryId, catSlug),
  ]);
  const articleHtml = typeof r2Content === "object" ? r2Content?.html : r2Content || "<p>Content could not be loaded.</p>";
  
  const textContent = articleHtml.replace(/<[^>]*>?/gm, '');
  const wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;
  const calculatedReadingTime = Math.max(1, Math.ceil(wordCount / 200));

  const related = relatedDb.map(a => ({
    ...a,
    mins: a.readingTime || 1,
    views: a.views,
    img: a.img || "",
    alt: a.title
  }));

  const discoverMore = discoverMoreDb.map(a => ({
    ...a,
    mins: a.readingTime || 1,
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
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(withEditorialSchema(generateNewsArticleJsonLd(article), articleHtml)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbJsonLd) }}
      />
      <ProgressBar />
      <ViewCounter articleId={article.id} />
      <article className="art pb-16" itemScope itemType="https://schema.org/NewsArticle">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
          
          {/* HEADER ROW */}
          <header className="mb-4 flex flex-col min-w-0 lg:col-start-2 lg:col-span-10 xl:col-start-2 xl:col-span-8">
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
                <div className="flex items-center gap-3 mb-4"><ArticleByline article={article} size={40} showRole /></div>
                <div className="font-mono text-[11px] text-[var(--muted)] tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Published <b><time itemProp="datePublished" className="text-[var(--ink)]">{(article.publishedAt || article.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></b></span>
                  <span className="hidden sm:inline">·</span>
                  <span>Updated <b>{article.updatedAt.toLocaleDateString("en-US")}</b></span>
                  <span className="hidden sm:inline">·</span>
                  <span><b>{calculatedReadingTime} min</b> read</span>
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
              </div>
              
              <figure className="art-hero mb-0">
                <div className="ph r-169 relative w-full overflow-hidden rounded-xl">
                  <Image 
                    src={getImgSrc(article.img || "", 1400, 788)} 
                    alt={article.featuredImageAlt || article.title}
                    fill 
                    sizes="(max-width: 1023px) 100vw, (max-width: 1279px) 83vw, 900px"
                    priority 
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-xs text-[var(--muted)] mt-3">
                  {article.featuredImageCaption || article.title}
                  {article.featuredImageCredit && (
                    <span className="credit block text-[10px] uppercase tracking-wider mt-1">
                      Image Credit: {article.featuredImageCredit}
                    </span>
                  )}
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
              <ArticleBody html={articleHtml} globalLeaderboard={globalLeaderboard} deviceName={article.title} />
            </div>

            <div className="art-foot mt-4">
        {article.tags && article.tags.length > 0 && (
          <div className="border-t border-[var(--line)] pt-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-2">Tags</span>
            <div className="tag-row mt-0">
              {article.tags.map(t => (
                <Link key={t.B} className="chip" href={`/tag/${t.tag.slug}`}>
                  {t.tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {(!article.tags || article.tags.length === 0) && <div className="border-t border-[var(--line)] my-4"></div>}

        <div className={article.tags && article.tags.length > 0 ? "border-t border-[var(--line)] pt-4 mb-4" : "mb-4"}>
          <ShareRow title={article.title} slug={article.slug} />
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

        <AuthorBox article={article} />

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
