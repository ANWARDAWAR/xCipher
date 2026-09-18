import { db } from "@/lib/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { CACHE_TAGS, articleTag, categoryTag } from "./cache-tags";
import { notifyPublished } from "@/lib/notifications";
import type { Prisma } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// Scheduled publication executor
// ──────────────────────────────────────────────────────────────────────────────
//
// scheduleArticle() writes status = SCHEDULED and a scheduledFor date, but
// nothing ever moved those rows to PUBLISHED. An article scheduled for Tuesday
// stayed SCHEDULED forever. This is the executor that closes the loop.
//
// Design notes:
//
// * Idempotent. The update is conditional on the row still being SCHEDULED with
//   a due date, so running twice publishes nothing twice. Safe to call from an
//   at-least-once scheduler, which is what every cron provider gives you.
//
// * Per-article isolation. One malformed row must not stop the rest of the
//   batch, so each article is handled in its own try. A failure is recorded and
//   the loop continues.
//
// * Bounded. A batch limit stops a backlog -- say the cron was down for a week
//   -- from turning into one enormous transaction. Leftovers are picked up on
//   the next tick.
//
// * publishedAt is set to the scheduled time, not the execution time. The cron
//   may fire minutes late; the article should read as published when the editor
//   said it would be, not when the worker happened to wake up.
// ──────────────────────────────────────────────────────────────────────────────

const DEFAULT_BATCH_LIMIT = 50;

export type ScheduledRunResult = {
  /** Articles that moved SCHEDULED -> PUBLISHED. */
  published: { id: string; slug: string; title: string | null }[];
  /** Articles that were due but could not be published. */
  failed: { id: string; error: string }[];
  /** True when the batch limit was hit and more rows remain due. */
  hasMore: boolean;
};

export async function runScheduledPublications(
  limit: number = DEFAULT_BATCH_LIMIT
): Promise<ScheduledRunResult> {
  const now = new Date();

  const due = await db.article.findMany({
    where: {
      status: "SCHEDULED",
      scheduledFor: { lte: now },
    },
    orderBy: { scheduledFor: "asc" },
    take: limit + 1, // one extra, purely to detect a backlog
    select: {
      id: true,
      slug: true,
      title: true,
      authorId: true,
      scheduledFor: true,
      category: { select: { slug: true } },
    },
  });

  const hasMore = due.length > limit;
  const batch = hasMore ? due.slice(0, limit) : due;

  const published: ScheduledRunResult["published"] = [];
  const failed: ScheduledRunResult["failed"] = [];
  // Collected as we go rather than derived afterwards: it keeps the set exact
  // (only categories of articles that actually published) without a second pass.
  const categorySlugs = new Set<string>();
  const auditRows: Prisma.AuditLogCreateManyInput[] = [];
  const notifyTargets: typeof due = [];

  for (const article of batch) {
    try {
      // Conditional update: re-checks status inside the write, so an article
      // unscheduled between the read above and this line is left alone, and a
      // concurrent run cannot publish the same row twice.
      const { count } = await db.article.updateMany({
        where: {
          id: article.id,
          status: "SCHEDULED",
          scheduledFor: { lte: now },
        },
        data: {
          status: "PUBLISHED",
          publishedAt: article.scheduledFor ?? now,
        },
      });

      if (count === 0) {
        // Lost the race, or the article was unscheduled. Not an error.
        continue;
      }

      // Audit rows and notifications are collected and flushed after the loop.
      //
      // The publish itself stays per-article on purpose: the conditional
      // updateMany above is what makes a concurrent run safe, and `count === 0`
      // has to be inspected for each row. Those semantics would be lost in a
      // single batched write. What was genuinely wasteful was the two awaits
      // that follow it, which have nothing to do with that race.
      auditRows.push({
        userId: null, // performed by the system, not a person
        action: "PUBLISH_ARTICLE_SCHEDULED",
        entityType: "Article",
        entityId: article.id,
        details: {
          scheduledFor: article.scheduledFor?.toISOString() ?? null,
          executedAt: now.toISOString(),
        },
      });

      notifyTargets.push(article);
      published.push({ id: article.id, slug: article.slug, title: article.title });
      if (article.category?.slug) categorySlugs.add(article.category.slug);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[scheduler] failed to publish ${article.id}:`, message);
      failed.push({ id: article.id, error: message });
    }
  }

  // One insert for the whole run instead of one per article.
  if (auditRows.length > 0) {
    try {
      await db.auditLog.createMany({ data: auditRows });
    } catch (error) {
      // The articles are published; losing the audit rows must not fail the
      // run or make it look like nothing happened.
      console.error("[scheduler] failed to write audit rows:", error);
    }
  }

  // Notifications in parallel rather than one await at a time. allSettled so a
  // single failed notification does not abandon the rest -- publication has
  // already happened and cannot be undone by a mail error.
  //
  // actorId is empty: there is no acting user, so the author is always notified
  // rather than being skipped as a self-notify.
  if (notifyTargets.length > 0) {
    const results = await Promise.allSettled(
      notifyTargets.map((article) => notifyPublished(article, ""))
    );
    for (const r of results) {
      if (r.status === "rejected") {
        console.error("[scheduler] notification failed:", r.reason);
      }
    }
  }

  if (published.length > 0) {
    try {
      // One tag covers every article listing -- homepage, /latest, category,
      // tag, author, search -- instead of dropping the entire route tree.
      revalidateTag(CACHE_TAGS.articles, { expire: 0 });
      revalidatePath("/admin/articles", "page");
      for (const article of published) {
        revalidateTag(articleTag(article.slug), { expire: 0 });
        revalidatePath(`/article/${article.slug}`, "page");
      }
      for (const slug of categorySlugs) {
        revalidateTag(categoryTag(slug), { expire: 0 });
      }
    } catch (error) {
      // A revalidation failure must not make the run look failed: the articles
      // are published either way, and the cache will expire on its own.
      console.error("[scheduler] revalidation failed:", error);
    }
  }

  return { published, failed, hasMore };
}
