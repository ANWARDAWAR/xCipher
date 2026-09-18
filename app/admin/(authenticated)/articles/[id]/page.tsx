import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role, ArticleStatus } from "@prisma/client";
import { authorize, buildArticleScope, Actor } from "@/lib/capabilities";
import StatusChip from "@/components/console/StatusChip";
import ArticleTimeline from "@/components/console/ArticleTimeline";
import { Edit3, ExternalLink, ArrowLeft, Eye, MessageSquare, History } from "lucide-react";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// Article detail hub — /admin/articles/[id]
//
// The list linked straight into /admin/editor/[id], so the only way to look at
// an article was to open it for editing. That is wrong for two reasons: a
// reviewer or a moderator may hold article.view.all without any edit right and
// had nowhere to land, and an article's history -- who submitted it, who asked
// for changes and why, what the revisions were -- was scattered across the
// review workspace and the audit log with no single view.
//
// This route is read-only. Every mutation stays where it already lives (the
// editor, the review workspace); this page links out to them when the actor is
// permitted, and simply omits the link when they are not.
// ─────────────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatDateTime(d: Date | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { authorProfile: true },
  });
  if (!dbUser) redirect("/admin/login");

  const actor: Actor = {
    id: dbUser.id,
    role: dbUser.role as Role,
    authorId: dbUser.authorProfile?.id || null,
  };

  if (!authorize(actor.role, "console.access")) {
    redirect("/admin/login");
  }

  // Authorization by scope, not by a role check. buildArticleScope already
  // encodes what each role may see -- including the deny-everything sentinel
  // for STAFF -- so folding it into the where clause means this page cannot
  // disagree with the list it was reached from. An article outside the actor's
  // scope is indistinguishable from one that does not exist, which is the
  // correct answer: confirming existence is itself a disclosure.
  const scope = buildArticleScope(actor);

  const article = await db.article.findFirst({
    where: { AND: [{ id }, scope] },
    select: {
      id: true,
      slug: true,
      title: true,
      deck: true,
      img: true,
      status: true,
      views: true,
      featured: true,
      homepagePlacement: true,
      author: true,
      authorId: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      scheduledFor: true,
      submittedAt: true,
      reviewedAt: true,
      approvedAt: true,
      archivedAt: true,
      seoTitle: true,
      seoDesc: true,
      authorModel: { select: { id: true, name: true, slug: true, avatar: true } },
      category: { select: { id: true, name: true, slug: true } },
      tags: { select: { id: true, name: true } },
      reviewer: { select: { name: true, email: true } },
      // Bodies are deliberately not selected here either -- this page renders
      // metadata and history, never the article text.
      revisions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          notes: true,
          statusChange: true,
          createdAt: true,
          title: true,
          user: { select: { name: true, email: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          decision: true,
          reason: true,
          reasonCode: true,
          fromStatus: true,
          toStatus: true,
          passNumber: true,
          createdAt: true,
          reviewer: { select: { name: true, email: true } },
        },
      },
      _count: { select: { revisions: true, comments: true } },
    },
  });

  if (!article) notFound();

  const canEdit =
    authorize(actor.role, "article.edit.any") ||
    (authorize(actor.role, "article.edit.own") &&
      !!actor.authorId &&
      article.authorId === actor.authorId);

  const canReview = authorize(actor.role, "article.review");
  const isInReview =
    article.status === "SUBMITTED" || article.status === "REVIEW";

  const byline = article.authorModel?.name || article.author || "Unassigned";

  const facts: Array<{ label: string; value: string | null }> = [
    { label: "Created", value: formatDateTime(article.createdAt) },
    { label: "Last updated", value: formatDateTime(article.updatedAt) },
    { label: "Submitted", value: formatDateTime(article.submittedAt) },
    { label: "Reviewed", value: formatDateTime(article.reviewedAt) },
    { label: "Approved", value: formatDateTime(article.approvedAt) },
    { label: "Scheduled for", value: formatDateTime(article.scheduledFor) },
    { label: "Published", value: formatDateTime(article.publishedAt) },
    { label: "Archived", value: formatDateTime(article.archivedAt) },
  ];
  const presentFacts = facts.filter((f) => f.value);

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Back link */}
      <div>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All articles
        </Link>
      </div>

      {/* Masthead. Dividers and spacing carry the hierarchy here rather than a
          card: this is the top of the page, it does not need a box to be found. */}
      <header className="space-y-4 pb-8 border-b border-line">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="space-y-3 min-w-0 flex-1">
            <StatusChip status={article.status as ArticleStatus} />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight font-[var(--f-display)]">
              {article.title}
            </h1>
            {article.deck && (
              <p className="text-base text-muted leading-relaxed max-w-2xl font-[var(--f-body)]">
                {article.deck}
              </p>
            )}
          </div>

          {article.img && (
            // Sized rather than fluid so a portrait lead image cannot push the
            // headline off the first screen.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.img}
              alt=""
              className="w-32 h-32 object-cover rounded-md border border-line shrink-0"
            />
          )}
        </div>

        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap text-sm text-muted font-[var(--f-ui)]">
          <span>
            By <span className="text-ink font-semibold">{byline}</span>
          </span>
          {article.category && (
            <span>
              in <span className="text-ink">{article.category.name}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {article.views.toLocaleString()}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            {article._count.comments}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            {article._count.revisions}
          </span>
        </div>

        {/* Actions. Each is capability-gated; an actor who cannot edit simply
            does not see the link rather than following it into a redirect. */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {canEdit && (
            <Link
              href={`/admin/editor/${article.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-ink text-surface rounded-md hover:opacity-90 transition-opacity"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          {canReview && isInReview && (
            <Link
              href={`/admin/review/${article.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-line text-ink rounded-md hover:bg-surface-2 transition-colors"
            >
              Open review
            </Link>
          )}
          {article.status === "PUBLISHED" && (
            <Link
              href={`/article/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold border border-line text-ink rounded-md hover:bg-surface-2 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View live
            </Link>
          )}
        </div>
      </header>

      {/* Dates. Only the milestones this article has actually reached, so a
          draft is not padded out with eight "—" rows. */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
          Milestones
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {presentFacts.map((f) => (
            <div key={f.label} className="space-y-0.5">
              <dt className="text-xs text-muted font-[var(--f-ui)]">{f.label}</dt>
              <dd className="text-sm text-ink font-[var(--f-ui)]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Placement, tags, SEO — the things an editor checks before publishing */}
      <section className="space-y-4 pt-8 border-t border-line">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
          Publication details
        </h2>
        <dl className="space-y-4">
          <div className="flex gap-4">
            <dt className="text-xs text-muted w-32 shrink-0 pt-0.5 font-[var(--f-ui)]">
              Homepage
            </dt>
            <dd className="text-sm text-ink font-[var(--f-ui)]">
              {article.homepagePlacement ? (
                <span className="capitalize">{article.homepagePlacement}</span>
              ) : (
                <span className="text-muted">
                  Not placed — ordered by recency
                </span>
              )}
              {article.featured && (
                <span className="ml-2 text-xs text-muted">(legacy featured flag set)</span>
              )}
            </dd>
          </div>

          <div className="flex gap-4">
            <dt className="text-xs text-muted w-32 shrink-0 pt-0.5 font-[var(--f-ui)]">
              Tags
            </dt>
            <dd className="text-sm text-ink font-[var(--f-ui)]">
              {article.tags.length > 0 ? (
                <span className="flex flex-wrap gap-x-2 gap-y-1">
                  {article.tags.map((t) => (
                    <span key={t.id}>{t.name}</span>
                  ))}
                </span>
              ) : (
                <span className="text-muted">None</span>
              )}
            </dd>
          </div>

          <div className="flex gap-4">
            <dt className="text-xs text-muted w-32 shrink-0 pt-0.5 font-[var(--f-ui)]">
              SEO title
            </dt>
            <dd className="text-sm text-ink font-[var(--f-ui)]">
              {article.seoTitle || (
                <span className="text-muted">Falls back to the headline</span>
              )}
            </dd>
          </div>

          <div className="flex gap-4">
            <dt className="text-xs text-muted w-32 shrink-0 pt-0.5 font-[var(--f-ui)]">
              SEO description
            </dt>
            <dd className="text-sm text-ink font-[var(--f-ui)]">
              {article.seoDesc || <span className="text-muted">Not set</span>}
            </dd>
          </div>
        </dl>
      </section>

      {/* History */}
      <section className="space-y-5 pt-8 border-t border-line">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
            History
          </h2>
          {article._count.revisions > 20 && (
            <span className="text-xs text-muted font-[var(--f-ui)]">
              Showing the 20 most recent of {article._count.revisions}
            </span>
          )}
        </div>

        <ArticleTimeline
          revisions={article.revisions.map((r) => ({
            id: r.id,
            notes: r.notes,
            statusChange: r.statusChange,
            createdAt: r.createdAt.toISOString(),
            title: r.title,
            actor: r.user?.name || r.user?.email || "Unknown",
          }))}
          reviews={article.reviews.map((r) => ({
            id: r.id,
            decision: r.decision,
            reason: r.reason,
            reasonCode: r.reasonCode,
            fromStatus: r.fromStatus,
            toStatus: r.toStatus,
            passNumber: r.passNumber,
            createdAt: r.createdAt.toISOString(),
            actor: r.reviewer?.name || r.reviewer?.email || "Unknown",
          }))}
        />
      </section>
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;

  // This must repeat the page's scoping rather than doing a bare findUnique.
  // generateMetadata runs independently of the component, so an unscoped lookup
  // here leaks the headline into the <title> tag even when the page itself
  // correctly renders notFound() -- the actor is denied the article but still
  // reads its title off the browser tab. Caught exactly that in testing.
  const user = await getCurrentUser();
  if (!user) return { title: "Article | xCipher" };

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { authorProfile: true },
  });
  if (!dbUser || !authorize(dbUser.role as Role, "console.access")) {
    return { title: "Article | xCipher" };
  }

  const scope = buildArticleScope({
    id: dbUser.id,
    role: dbUser.role as Role,
    authorId: dbUser.authorProfile?.id || null,
  });

  const article = await db.article.findFirst({
    where: { AND: [{ id }, scope] },
    select: { title: true },
  });

  return {
    title: article ? `${article.title} | xCipher` : "Article | xCipher",
  };
}
