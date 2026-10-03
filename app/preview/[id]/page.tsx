import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getImgSrc, fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canViewReviewQueue } from "@/lib/permissions";
import { eq, inArray, and, not, notInArray } from "drizzle-orm";
import { article as articleTable, user as userTable } from "@/lib/db/schema";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import TableOfContents from "@/components/article/TableOfContents";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import { fetchFromR2 } from "@/lib/storage";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";
import ActiveCategorySetter from "@/components/layout/ActiveCategorySetter";
import { Role } from "@/lib/types";
import { ARTICLE_CARD_COLUMNS, ARTICLE_CARD_WITH } from "@/lib/queries";
import ArticleByline from "@/components/article/ArticleByline";
import AuthorBox from "@/components/article/AuthorBox";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const [article] = await db.query.article.findMany({ where: eq(articleTable.id, id), limit: 1 });
  if (!article) return {};
  
  return {
    title: `Preview: ${article.title} — xSypher`,
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
  const [article] = await db.query.article.findMany({ 
    where: eq(articleTable.id, id), 
    limit: 1,
    with: { category: { with: { parent: true } }, authorModel: true, tags: true } 
  });
  
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

  const [dbUser] = await db.query.user.findMany({ where: eq(userTable.id, user.id), with: { authorProfile: true }, limit: 1 });
  
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
  
  const mainCat = (article.category as any)?.parent;
  const subCat = mainCat ? article.category : null;
  const catName = mainCat?.name || article.category?.name || "News";
  const catSlug = mainCat?.slug || article.category?.slug || "news";
  const r2Content = await fetchFromR2(article.contentUrl);
  const articleHtml = typeof r2Content === "object" ? r2Content?.html : r2Content || "<p>Content could not be loaded.</p>";

  // Related articles
  let relatedDb: any[] = [];
  if (article.tags && article.tags.length > 0) {
    relatedDb = await db.query.article.findMany({
      // @ts-ignore - complex relations with many-to-many might need different approach in drizzle
      // using a simpler approach or raw SQL for related articles by tags in the future
      where: and(
        not(eq(articleTable.id, article.id)),
        eq(articleTable.status, "PUBLISHED")
      ),
      orderBy: (a, { desc }) => [desc(a.publishedAt)],
      limit: 3,
      columns: ARTICLE_CARD_COLUMNS,
      with: ARTICLE_CARD_WITH
    });
  }

  if (relatedDb.length < 3 && article.categoryId) {
    const excludeIds = [article.id, ...relatedDb.map(r => r.id)];
    const fallback = await db.query.article.findMany({
      where: and(
        eq(articleTable.categoryId, article.categoryId),
        notInArray(articleTable.id, excludeIds),
        eq(articleTable.status, "PUBLISHED")
      ),
      orderBy: (a, { desc }) => [desc(a.publishedAt)],
      limit: 3 - relatedDb.length,
      columns: ARTICLE_CARD_COLUMNS,
      with: ARTICLE_CARD_WITH
    });
    relatedDb = [...relatedDb, ...fallback];
  }
  
  const related = relatedDb.map((a: any) => ({
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

      <ActiveCategorySetter slug={catSlug} />
      <ProgressBar />
      
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
                <div className="flex items-center gap-3 mb-4"><ArticleByline article={article} size={40} showRole /></div>
                <div className="font-mono text-[11px] text-[var(--muted)] tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Published <b><time itemProp="datePublished" className="text-[var(--ink)]">{(article.publishedAt || article.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</time></b></span>
                  <span className="hidden sm:inline">·</span>
                  <span>Updated <b>{article.updatedAt.toLocaleDateString("en-US")}</b></span>
                  <span className="hidden sm:inline">·</span>
                  <span><b>{(article as any).readingTime || 1} min</b> read</span>
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
              <ArticleBody html={articleHtml} globalLeaderboard={{}} deviceName={article.title} />
            </div>

            <div className="art-foot mt-12 pt-8 border-t border-[var(--line)]">
              <div className="tag-row">
                {(article.tags || []).map((t: any) => (
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

              <AuthorBox article={article} />

              <CommentsSection articleSlug={article.slug} />

              <section aria-label="Read Next" style={{ marginTop: "48px", paddingTop: "40px", borderTop: "1px solid var(--line)" }}>
                <h2 style={{ fontFamily: "var(--f-ui)", fontSize: "16px", fontWeight: 700, letterSpacing: ".02em", marginBottom: "20px" }}>Read Next</h2>
                <div className="grid4">
                  {related.map((a: any) => (
                    <StoryCard key={a.id} article={a as any} showDeck={false} />
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
