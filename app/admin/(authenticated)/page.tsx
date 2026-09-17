import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildArticleScope } from "@/lib/capabilities";
import StatusChip from "@/components/console/StatusChip";
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

  let isAuthorOnly = false;
  let userFirstName = "Editor";

  try {
    const user = await getCurrentUser();
    isAuthorOnly = user?.role === "AUTHOR";
    userFirstName = user?.name?.split(" ")[0] || "Editor";

    const dbUser = user ? await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } }) : null;
    const authorId = dbUser?.authorProfile?.id;
    
    const actor = {
      id: user?.id || "",
      role: (user?.role as any) || "CONTRIBUTOR",
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
          <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
            Editorial Overview
          </h1>
          <p className="text-sm text-muted mt-1 font-[var(--f-ui)]">
            Welcome back, {userFirstName}. Here is the current pulse of the xCipher newsroom.
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 active:scale-[0.99]"
          >
            <Plus className="w-4 h-4" />
            <span>New Story</span>
          </Link>
        </div>
      </div>

      {/* ── High-Contrast KPI Metric Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Total Stories */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all hover:border-line-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              {isAuthorOnly ? "Your Stories" : "Total Articles"}
            </span>
            <div className="p-2 rounded-lg bg-surface-2 text-ink">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight">
            {totalArticles}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1">
            <span>Indexed in publication</span>
          </div>
        </div>

        {/* Card 2: Published Stories */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all hover:border-line-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Published
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight">
            {publishedCount}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <span>Live on front page & sections</span>
          </div>
        </div>

        {/* Card 3: Drafts & In Progress */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all hover:border-line-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              In Progress
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Edit3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight">
            {draftsCount}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1">
            <span>Drafts & revisions queued</span>
          </div>
        </div>

        {/* Card 4: Total Readers / Views */}
        <div className="bg-surface border border-line rounded-xl p-5 shadow-sm transition-all hover:border-line-2">
          <div className="flex items-center justify-between text-muted">
            <span className="text-[11px] font-semibold tracking-wider uppercase">
              Total Reads
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-bold font-[var(--f-display)] text-ink mt-3 tracking-tight">
            {fmtViews(totalViews)}
          </div>
          <div className="text-xs text-muted mt-2 flex items-center gap-1">
            <span>Accumulated readership</span>
          </div>
        </div>
      </div>

      {/* ── Editorial Stories Workbench (Split Cards) ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Top Stories by Reads (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-line rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-surface">
            <div>
              <h2 className="text-sm font-bold text-ink tracking-wide uppercase font-[var(--f-ui)] flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-red-600 rounded-sm" />
                {isAuthorOnly ? "Your Top Stories" : "Top Stories by Reads"}
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
                const authorName = story.authorModel?.name || story.author || "xCipher Staff";
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
                            href={`/${story.slug}`}
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
              <div className="py-12 text-center text-muted text-sm">
                <FileText className="w-8 h-8 mx-auto text-faint mb-2" />
                <p>No published stories recorded yet.</p>
                <Link
                  href="/admin/editor"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Publish your first story</span>
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
                {isAuthorOnly ? "Your Drafts" : "Drafts in Progress"}
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
              <div className="py-12 text-center text-muted text-sm">
                <Edit3 className="w-8 h-8 mx-auto text-faint mb-2" />
                <p>No drafts currently in progress.</p>
                <Link
                  href="/admin/editor"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create a draft</span>
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
    </div>
  );
}
