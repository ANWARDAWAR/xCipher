import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildArticleScope, authorize } from "@/lib/capabilities";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import StatusChip from "@/components/console/StatusChip";
import AuthorStatusBoard, { type BoardArticle } from "@/components/console/AuthorStatusBoard";
import { 
  Plus, 
  FileText, 
  CheckCircle2, 
  Edit3, 
  TrendingUp, 
  Eye, 
  ExternalLink, 
  ArrowRight, 
  Clock, 
  Folder
} from "lucide-react";

export const dynamic = "force-dynamic";

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export default async function AdminDashboard() {
  let publishedCount = 0;
  let draftsCount = 0;
  let totalArticles = 0;
  let totalViews = 0;
  let topStories: any[] = [];
  let latestDrafts: any[] = [];
  // Role-specific attention counts. Zero is a meaningful value here (an empty
  // queue), so these stay numbers rather than being left undefined.
  let awaitingReview = 0;
  let unclaimedReview = 0;
  let changesRequested = 0;
  let scheduledCount = 0;
  // Author board: their own work, grouped by state. Only populated for roles
  // without article.view.all -- everyone else gets the newsroom-wide view.
  let boardArticles: BoardArticle[] = [];
  const boardCounts: Record<string, number> = {};

  // Resolved outside the try below: redirect() signals by throwing NEXT_REDIRECT,
  // so calling it inside a try/catch swallows the redirect and renders the page
  // anyway. The layout already guards this route; this is defence in depth.
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const userFirstName = user.name?.split(" ")[0] || "Editor";

  // Depends only on the role, so it must not be left at a default if the
  // queries below fail -- otherwise a DB error silently relabels an owner's
  // dashboard as a personal one.
  const actorRole = user.role as Role;
  const canViewAll = authorize(actorRole, "article.view.all");
  const canReview = authorize(actorRole, "article.review");
  const canWrite = authorize(actorRole, "article.create");

  try {
    const dbUser = await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } });
    const authorId = dbUser?.authorProfile?.id;
    
    const actor = {
      id: user.id,
      role: user.role as any,
      authorId: authorId || null
    };

    const scopeWhere = buildArticleScope(actor);
    const statusCounts = await db.article.groupBy({
      by: ['status'],
      where: scopeWhere,
      _count: { id: true },
    });

    for (const group of statusCounts) {
      if (group.status === 'PUBLISHED') publishedCount = group._count.id;
      else if (group.status === 'DRAFT') draftsCount = group._count.id;
      totalArticles += group._count.id;
    }

    // The status breakdown above is already scoped, so the attention counts can
    // be read straight out of it rather than issued as extra queries.
    for (const group of statusCounts) {
      if (group.status === 'SUBMITTED') awaitingReview = group._count.id;
      else if (group.status === 'REVISION_REQUESTED') changesRequested = group._count.id;
      else if (group.status === 'SCHEDULED') scheduledCount = group._count.id;
    }

    // Unclaimed submissions are the one figure the grouped query cannot give,
    // and it is the number a reviewer actually acts on: a queue of 20 with 20
    // already claimed needs nobody, a queue of 3 with 0 claimed needs someone
    // now.
    if (canReview) {
      unclaimedReview = await db.article.count({
        where: { status: "SUBMITTED", reviewedById: null },
      });
    }

    const wherePublished = { ...scopeWhere, status: "PUBLISHED" as const };
    const whereDraft = { ...scopeWhere, status: "DRAFT" as const };
    
    const viewsAggregation = await db.article.aggregate({ _sum: { views: true }, where: wherePublished });
    totalViews = viewsAggregation._sum.views || 0;

    topStories = await db.article.findMany({
      where: wherePublished,
      orderBy: { views: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        views: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        author: true,
        authorModel: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    });

    // Author board. Scoped by buildArticleScope like every other console
    // query, so this cannot become a hole that shows one author another's
    // drafts -- the filter is derived from the actor, not from the UI.
    if (!canViewAll) {
      for (const group of statusCounts) {
        boardCounts[group.status] = group._count.id;
      }

      boardArticles = await db.article.findMany({
        where: {
          ...scopeWhere,
          status: { in: ["REVISION_REQUESTED", "DRAFT", "SUBMITTED", "PUBLISHED"] },
          // "All published" is part of an author's scope so they can read the
          // site, but this board is about *their* desk. Without this the
          // Published column would fill with other people's work.
          ...(authorId ? { authorId } : {}),
        },
        orderBy: { updatedAt: "desc" },
        // 5 per column at most; the column footer links to the full list.
        take: 20,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          publishedAt: true,
          views: true,
          category: { select: { name: true } },
        },
      });

      // Recount from the author's own articles: statusCounts includes every
      // published article in the publication, which would overstate the
      // Published column against the list beneath it.
      if (authorId) {
        const ownCounts = await db.article.groupBy({
          by: ["status"],
          where: { authorId },
          _count: { id: true },
        });
        for (const key of Object.keys(boardCounts)) delete boardCounts[key];
        for (const group of ownCounts) boardCounts[group.status] = group._count.id;
      }
    }

    latestDrafts = await db.article.findMany({
      where: whereDraft,
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        author: true,
        authorModel: { select: { name: true } },
        category: { select: { name: true } },
      },
    });
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* ── Top Header Greeting & Quick Action ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink font-[family:var(--f-display)]">
            Editorial Overview
          </h1>
          <p className="text-sm text-muted mt-1 font-[var(--f-ui)]">
            Welcome back, {userFirstName}. Here is the current pulse of the xSypher newsroom.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-surface-2 hover:bg-surface-3 border border-line rounded-lg transition-colors"
          >
            <span>All Articles</span>
          </Link>
          <Link
            href="/admin/editor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-deep active:bg-accent-press text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Story</span>
          </Link>
        </div>
      </div>

      {/* ── Quick Actions Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/editor" className="flex flex-col p-4 bg-surface border border-line rounded-xl hover:border-accent hover:shadow-md transition-all group">
          <div className="p-2 bg-accent/10 text-accent rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="font-semibold text-ink text-sm">Draft New Story</span>
          <span className="text-xs text-muted mt-1">Open the Tiptap editor</span>
        </Link>
        {canReview && (
          <Link href="/admin/review" className="flex flex-col p-4 bg-surface border border-line rounded-xl hover:border-purple-500 hover:shadow-md transition-all group">
            <div className="p-2 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-semibold text-ink text-sm">Review Queue</span>
            <span className="text-xs text-muted mt-1">{awaitingReview} awaiting review</span>
          </Link>
        )}
        <Link href="/admin/taxonomy" className="flex flex-col p-4 bg-surface border border-line rounded-xl hover:border-blue-500 hover:shadow-md transition-all group">
          <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
            <Folder className="w-5 h-5" />
          </div>
          <span className="font-semibold text-ink text-sm">Manage Taxonomy</span>
          <span className="text-xs text-muted mt-1">Categories & tags</span>
        </Link>
        <Link href="/admin/users" className="flex flex-col p-4 bg-surface border border-line rounded-xl hover:border-emerald-500 hover:shadow-md transition-all group">
          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <span className="font-semibold text-ink text-sm">Invite User</span>
          <span className="text-xs text-muted mt-1">Add staff members</span>
        </Link>
      </div>

      <hr className="border-line my-6" />

      {/* ── Needs your attention ─────────────────────────────────────
          Role-aware, and deliberately placed above the KPI cards: counts of
          total articles are interesting, but what a person opens the console
          to find out is whether anything is waiting on *them*. A reviewer and
          an author need different answers to that, which is why this strip is
          built from capabilities rather than shown to everyone.

          The whole block is omitted when nothing is outstanding. An empty
          "nothing to do" panel is noise that trains people to scroll past the
          place their work appears. */}
      {(() => {
        const items: { href: string; label: string; count: number; tone: "urgent" | "normal" }[] = [];

        if (canReview) {
          if (unclaimedReview > 0) {
            items.push({
              href: "/admin/review",
              label: unclaimedReview === 1 ? "submission unclaimed" : "submissions unclaimed",
              count: unclaimedReview,
              tone: "urgent",
            });
          }
          const claimed = awaitingReview - unclaimedReview;
          if (claimed > 0) {
            items.push({
              href: "/admin/review",
              label: claimed === 1 ? "review in progress" : "reviews in progress",
              count: claimed,
              tone: "normal",
            });
          }
        }

        if (canWrite && changesRequested > 0) {
          items.push({
            href: "/admin/articles?status=REVISION_REQUESTED",
            label: changesRequested === 1 ? "story needs changes" : "stories need changes",
            count: changesRequested,
            tone: "urgent",
          });
        }

        if (scheduledCount > 0) {
          items.push({
            href: "/admin/articles?status=SCHEDULED",
            label: scheduledCount === 1 ? "story scheduled" : "stories scheduled",
            count: scheduledCount,
            tone: "normal",
          });
        }

        if (items.length === 0) return null;

        return (
          <div className="border-l-2 border-accent pl-4 sm:pl-5 py-1">
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-muted mb-2.5">
              Needs your attention
            </h2>
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2.5">
              {items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group inline-flex items-baseline gap-2 hover:underline underline-offset-4 decoration-line"
                  >
                    <span
                      className={`text-2xl font-bold tabular-nums font-[var(--f-display)] ${
                        item.tone === "urgent" ? "text-accent" : "text-ink"
                      }`}
                    >
                      {item.count}
                    </span>
                    <span className="text-sm text-ink-2 group-hover:text-ink transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* ── High-Contrast KPI Metric Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Stories */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-line-2 hover:-translate-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              {canViewAll ? "Total Articles" : "Your Stories"}
            </span>
            <div className="p-2 rounded-lg bg-surface-2 text-ink">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight relative z-10">
            {totalArticles}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1 relative z-10">
            <span>Indexed in publication</span>
          </div>
        </div>

        {/* Card 2: Published Stories */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-line-2 hover:-translate-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Published
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight relative z-10">
            {publishedCount}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1 relative z-10">
            <span>Live on front page & sections</span>
          </div>
        </div>

        {/* Card 3: Drafts & In Progress */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-line-2 hover:-translate-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              In Progress
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight relative z-10">
            {draftsCount}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1 relative z-10">
            <span>Drafts & revisions queued</span>
          </div>
        </div>

        {/* Card 4: Total Readers / Views */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-line-2 hover:-translate-y-0.5 relative overflow-hidden group">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Total Reads
            </span>
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight relative z-10">
            {fmtViews(totalViews)}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1 relative z-10">
            <span>Accumulated readership</span>
          </div>
          
          {/* Mock Sparkline SVG for depth */}
          <div className="absolute bottom-0 left-0 w-full h-16 pointer-events-none opacity-20 text-accent group-hover:opacity-30 transition-opacity">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <defs>
                <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,10 L60,15 L70,5 L80,12 L90,2 L100,8 L100,30 L0,30 Z" fill="url(#sparkline-gradient)" />
              <path d="M0,30 L10,25 L20,28 L30,20 L40,22 L50,10 L60,15 L70,5 L80,12 L90,2 L100,8" fill="none" className="stroke-current stroke-[1.5px]" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Author status board ──────────────────────────────────────
          Shown only to roles without article.view.all. An author cannot act on
          publication-wide totals; what they need is their own work sorted by
          who owes the next move. */}
      {!canViewAll && (
        <div className="pt-1">
          <div className="flex items-baseline justify-between gap-3 mb-5">
            <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-accent rounded-sm" />
              Your desk
            </h2>
            <Link
              href="/admin/articles"
              className="text-xs font-semibold text-muted hover:text-ink transition-colors"
            >
              All your stories →
            </Link>
          </div>
          <AuthorStatusBoard articles={boardArticles} counts={boardCounts} />
        </div>
      )}

      {/* ── Editorial Stories Workbench (Split Cards) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Top Stories by Reads (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-accent rounded-sm" />
                {canViewAll ? "Top Stories by Reads" : "Your Top Stories"}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Most engaged articles published across all sections
              </p>
            </div>
            <Link
              href="/admin/articles?sort=views"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-line">
            {topStories.length > 0 ? (
              topStories.map((story) => {
                const authorName = story.authorModel?.name || story.author || "xSypher Staff";
                return (
                  <div
                    key={story.id}
                    className="p-4 sm:px-5 sm:py-3.5 hover:bg-surface-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/editor/${story.id}`}
                        className="text-sm font-semibold text-ink hover:text-accent transition-colors line-clamp-1 block"
                      >
                        {story.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-muted">
                        {story.category?.name && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-3 text-ink-2 text-[11px] font-medium">
                            <Folder className="w-2.5 h-2.5 text-muted" />
                            {story.category.name}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDate(story.publishedAt || story.createdAt)}
                        </span>
                        <span className="text-[11px] text-faint hidden sm:inline">·</span>
                        <span className="text-[11px] text-muted hidden sm:inline">{authorName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-ink bg-surface-2 px-2.5 py-1 rounded border border-line">
                        <Eye className="w-3.5 h-3.5 text-muted" />
                        <span>{fmtViews(story.views || 0)}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/editor/${story.id}`}
                          className="px-2.5 py-1 text-xs font-medium rounded text-ink bg-surface hover:bg-surface-3 border border-line transition-colors"
                        >
                          Edit
                        </Link>
                        {story.slug && (
                          <Link
                            href={`/article/${story.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-muted hover:text-ink rounded hover:bg-surface-3 transition-colors"
                            title="Preview live article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-line bg-surface-2 rounded-xl m-4">
                <div className="mb-2">
                  <FileText className="w-5 h-5 text-faint" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1">No stories found</h3>
                <p className="text-xs text-muted mb-4 max-w-[200px]">There are no published stories in the database yet.</p>
                <Link
                  href="/admin/editor"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-line hover:border-line-2 shadow-sm hover:shadow rounded-lg transition-all"
                >
                  <Plus className="w-3 h-3 text-accent" />
                  <span>Create Story</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Drafts & In Progress (5 cols) */}
        <div className="lg:col-span-5 bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm" />
                {canViewAll ? "Drafts in Progress" : "Your Drafts"}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Workspaces currently being written or edited
              </p>
            </div>
            <Link
              href="/admin/articles?status=DRAFT"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-line">
            {latestDrafts.length > 0 ? (
              latestDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="p-4 sm:px-5 sm:py-3.5 hover:bg-surface-2 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/editor/${draft.id}`}
                      className="text-sm font-semibold text-ink hover:text-accent transition-colors line-clamp-1 block"
                    >
                      {draft.title || "Untitled story draft"}
                    </Link>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                      <StatusChip status={draft.status} />
                      <span className="text-[11px] text-faint">·</span>
                      <span className="text-[11px] text-muted">
                        {formatRelativeTime(draft.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/admin/editor/${draft.id}`}
                    className="shrink-0 px-3 py-1 text-xs font-medium rounded-lg text-ink bg-surface-2 hover:bg-surface-3 border border-line transition-colors flex items-center gap-1"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-3 h-3 text-muted" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center border-2 border-dashed border-line bg-surface-2 rounded-xl m-4">
                <div className="mb-2">
                  <Edit3 className="w-5 h-5 text-faint" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1">No drafts in progress</h3>
                <p className="text-xs text-muted mb-4 max-w-[200px]">You don't have any active workspaces right now.</p>
                <Link
                  href="/admin/editor"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-ink bg-surface border border-line hover:border-line-2 shadow-sm hover:shadow rounded-lg transition-all"
                >
                  <Plus className="w-3 h-3 text-accent" />
                  <span>Start New Draft</span>
                </Link>
              </div>
            )}
          </div>

          <div className="p-4 bg-surface-2 border-t border-line text-center">
            <Link
              href="/admin/editor"
              className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-semibold text-ink bg-surface hover:bg-surface-3 border border-line rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-accent" />
              <span>Start new story</span>
            </Link>
          </div>
        </div>

      </div>

      {/* ── Operational Widgets (Moderation & Activity) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start mt-6">
        
        {/* Pending Moderation Panel */}
        <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface">
            <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-red-500 rounded-sm" />
              Action Required
            </h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-500/20 rounded">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Articles awaiting review</span>
              </div>
              <span className="text-sm font-bold">3</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-500/20 rounded">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">Comments flagged</span>
              </div>
              <span className="text-sm font-bold">12</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2 border border-line">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-surface-3 text-muted rounded">
                  <Folder className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-ink">Author applications</span>
              </div>
              <span className="text-sm font-bold text-muted">0</span>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface">
            <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-blue-500 rounded-sm" />
              Newsroom Activity
            </h2>
            <Link href="/admin/audit-logs" className="text-xs font-semibold text-accent hover:underline flex items-center gap-1">
              <span>View logs</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <div className="relative border-l border-line ml-3 space-y-6">
              
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-surface border-2 border-emerald-500 rounded-full" />
                <p className="text-sm text-ink"><span className="font-semibold">Alex Editor</span> published <span className="font-medium italic">"The Future of AI"</span></p>
                <p className="text-xs text-muted mt-1">2 hours ago</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-surface border-2 border-line-2 rounded-full" />
                <p className="text-sm text-ink"><span className="font-semibold">Sam Writer</span> updated draft <span className="font-medium italic">"Cybersecurity 2027"</span></p>
                <p className="text-xs text-muted mt-1">4 hours ago</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-surface border-2 border-amber-500 rounded-full" />
                <p className="text-sm text-ink"><span className="font-semibold">Admin</span> flagged a comment by <span className="font-medium italic">user123</span></p>
                <p className="text-xs text-muted mt-1">5 hours ago</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-surface border-2 border-purple-500 rounded-full" />
                <p className="text-sm text-ink"><span className="font-semibold">Jordan</span> submitted a story for review</p>
                <p className="text-xs text-muted mt-1">Yesterday</p>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
