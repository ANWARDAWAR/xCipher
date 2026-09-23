import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getImgSrc, fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canViewReviewQueue } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { SocialIcon } from "@/components/author/AuthorProfileView";
import ArticleBody from "@/components/article/ArticleBody";
import ArticleSidebar from "@/components/article/ArticleSidebar";
import TableOfContents from "@/components/article/TableOfContents";
import StoryCard from "@/components/article/StoryCard";
import CommentsSection from "@/components/article/CommentsSection";
import ProgressBar from "@/components/article/ProgressBar";
import ListenButton from "@/components/article/ListenButton";
import ArticleMobileToolbar from "@/components/article/ArticleMobileToolbar";
import ActiveCategorySetter from "@/components/layout/ActiveCategorySetter";
import { ARTICLE_CARD_SELECT } from "@/lib/queries";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await db.article.findUnique({ where: { id } });
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
  const article = await db.article.findUnique({ 
    where: { id }, 
    include: { category: { include: { parent: true } }, authorModel: true, tags: true } 
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

  if (relatedDb.length < 3) {
    const fallback = await db.article.findMany({
      where: {
        categoryId: article.categoryId,
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
                  <span><b>{fmtViews(article.views || 0)}</b> reads</span>
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
                  {authorBio}
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
