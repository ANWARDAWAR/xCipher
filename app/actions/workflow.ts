"use server";

import { db } from "@/lib/db";
import { getActor } from "@/lib/auth";
import { authorize, ROLE_CAPABILITIES } from "@/lib/capabilities";
import { eq, and, inArray, or, sql } from "drizzle-orm";
import { article, user, _articleToTag, articleRevision, articleReview, auditLog, comment, notification } from "@/lib/db/schema";


const REVIEWER_ROLES = (Object.keys(ROLE_CAPABILITIES) as Role[]).filter(role => 
  authorize(role, "article.review")
);
import { validateTransition, TRANSITIONS, ArticleForTransition } from "@/lib/workflow";
import {
  notifySubmitted,
  notifyApproved,
  notifyChangesRequested,
  notifyRejected,
  notifyPublished,
  notifyUnpublished,
} from "@/lib/notifications";
import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { CACHE_TAGS, articleTag, articleMutationTags } from "@/lib/cache-tags";
import { deleteFileFromR2, deleteKeyFromR2, fetchFromR2, getR2Config } from "@/lib/storage";
import { ArticleStatus, Role } from "@/lib/types";

export type ActionResponse<T = any> =
  | { ok: true; data?: T; updatedAt?: string }
  | { ok: false; code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "RATE_LIMITED" | "SERVER"; message: string };

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function getArticle(id: string) {
  return await db.query.article.findFirst({
    where: eq(article.id, id),
    columns: {
      id: true,
      status: true,
      authorId: true,
      reviewedById: true,
      title: true,
      slug: true,
      categoryId: true,
      deck: true,
      contentUrl: true,
      img: true,
    },
    with: { category: { columns: { slug: true } }, authorModel: { columns: { slug: true } } }
  });
}

async function checkSelfReviewGuard(articleData: any, actor: any) {
  if (articleData.authorId && actor.authorId && articleData.authorId === actor.authorId) {
    const [activeReviewersRes] = await db.select({ count: sql<number>`count(*)::int` }).from(user).where(and(eq(user.isActive, true), inArray(user.role, REVIEWER_ROLES)));
    const activeReviewersCount = activeReviewersRes?.count || 0;
    if (activeReviewersCount > 1) {
      return { ok: false, code: "FORBIDDEN", message: "A reviewer cannot decide on their own article. Please ask another editor to review it." };
    }
    return { ok: true, isSelfReview: true };
  }
  return { ok: true, isSelfReview: false };
}

// ──────────────────────────────────────────────────────────────────────────────
// Review Claiming (Not strict transitions, but workflow operations)
// ──────────────────────────────────────────────────────────────────────────────

export async function claimReview(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  if (!authorize(actor.role, "article.review")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions to claim reviews." };
  }

  try {
    const articleData = await getArticle(id);
    if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
    if (articleData.reviewedById && articleData.reviewedById !== actor.id) {
      return { ok: false, code: "CONFLICT", message: "Article is already claimed by another reviewer." };
    }

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(article).where(and(eq(article.id, id), sql`${article.reviewedById} IS NULL`, eq(article.status, articleData.status)));
    if (count > 0) {
      await db.update(article).set({ reviewedById: actor.id, updatedAt: new Date() }).where(eq(article.id, id));
    }

    if (count === 0) {
      return { ok: false, code: "CONFLICT", message: "Article was claimed by another reviewer just now." };
    }

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: actor.id,
      action: "CLAIM_REVIEW",
      entityType: "Article",
      entityId: id
    });

    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/review/${id}`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, code: "SERVER", message: e.message };
  }
}

export async function releaseReview(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  
  const articleData = await getArticle(id);
  if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
  
  if (articleData.reviewedById !== actor.id) {
    return { ok: false, code: "FORBIDDEN", message: "You cannot release an article you have not claimed." };
  }

  await db.update(article).set({ reviewedById: null, updatedAt: new Date() }).where(eq(article.id, id));

  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: actor.id,
    action: "RELEASE_REVIEW",
    entityType: "Article",
    entityId: id
  });

  revalidatePath(`/admin/review`);
  revalidatePath(`/admin/review/${id}`);
  return { ok: true };
}

export async function takeOverReview(id: string, confirm: boolean): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  if (!authorize(actor.role, "article.review")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions." };
  }

  const articleData = await getArticle(id);
  if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  if (!articleData.reviewedById) {
    return { ok: false, code: "VALIDATION", message: "This article is unclaimed. Please use the ordinary claim action." };
  }
  
  if (articleData.reviewedById === actor.id) {
    return { ok: false, code: "VALIDATION", message: "You are already the reviewer of this article." };
  }
  
  if (!confirm) {
    return { ok: false, code: "VALIDATION", message: "You must explicitly confirm to take over an article." };
  }

  await db.update(article).set({ reviewedById: actor.id, updatedAt: new Date() }).where(eq(article.id, id));

  await db.insert(auditLog).values({
    id: crypto.randomUUID(),
    userId: actor.id,
    action: "TAKEOVER_REVIEW",
    entityType: "Article",
    entityId: id,
    details: { previousReviewerId: articleData.reviewedById, newReviewerId: actor.id }
  });

  revalidatePath(`/admin/review`);
  revalidatePath(`/admin/review/${id}`);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Transitions
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Invalidate every public route whose content depends on this article.
 *
 * The public pages are cached with a revalidate window now, so these calls are
 * what makes an editorial change appear immediately instead of up to five
 * minutes later. Previously each transition inlined its own list and they had
 * drifted: none of them invalidated /latest (only the scheduler did) or the
 * author's profile page, so unpublishing an article left it visible on both
 * until the timer expired. Keeping the list in one function is what stops that
 * drift from recurring.
 */
function revalidateArticleRoutes(article: {
  slug: string;
  category?: { slug: string } | null;
  authorModel?: { slug: string } | null;
}) {
  // Tags, not revalidatePath("/", "layout").
  //
  // That call was the broadest invalidation Next.js offers: it drops every
  // route under the root layout, so publishing one story discarded the
  // homepage, /latest, all thirteen categories, every tag page, every author
  // page and every other article. On a title that ships several stories an
  // hour the public cache was rarely warm.
  //
  // articleMutationTags names what actually changed -- the article listings,
  // this article, its category, its author -- and leaves everything else
  // cached.
  for (const tag of articleMutationTags(article)) {
    // @ts-ignore
    revalidateTag(tag);
  }

  // The article's own route is still invalidated by path. Its page component
  // queries the article directly rather than through a tagged helper, because
  // it needs the body columns the card select deliberately omits.
  revalidatePath(`/article/${article.slug}`, "page");
  
  // Revalidate the sitemap so search engines immediately see the new/updated URL.
  revalidatePath("/sitemap.xml");
}

async function executeTransition(
  id: string,
  to: any,
  actionFn: (articleData: any, actor: any) => Promise<ActionResponse>
): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };

  const articleData = await getArticle(id);
  if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  const validationError = validateTransition(articleData.status, to, actor, articleData);
  if (validationError) {
    return { ok: false, code: "FORBIDDEN", message: validationError };
  }

  const res = await actionFn(articleData, actor);
  if (res.ok) {
    const [fresh] = await db.select({ updatedAt: article.updatedAt }).from(article).where(eq(article.id, id)).limit(1);
    if (fresh) {
      res.updatedAt = fresh.updatedAt.toISOString();
    }
  }
  return res;
}

export async function submitArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "SUBMITTED", async (articleData, actor) => {
    if (!articleData.title?.trim()) {
      return { ok: false, code: "VALIDATION", message: "Title is required for submission." };
    }
    if (!articleData.deck || articleData.deck.trim().length < 10) {
      return { ok: false, code: "VALIDATION", message: "A short description (deck) of at least 10 characters is required." };
    }
    if (!articleData.categoryId) {
      return { ok: false, code: "VALIDATION", message: "Category is required." };
    }
    const r2Content = await fetchFromR2(articleData.contentUrl);
    const articleHtml = typeof r2Content === "object" ? r2Content?.html : r2Content || "";
    const textContent = articleHtml.replace(/<[^>]*>?/gm, '');
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      return { ok: false, code: "VALIDATION", message: `Content must be at least 50 words. Currently: ${wordCount}` };
    }

    
            await db.update(article).set({ 
              status: "SUBMITTED", 
              submittedAt: new Date(),
              submittedById: actor.id,
              updatedAt: new Date()
            }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "SUBMIT_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    await notifySubmitted(articleData, actor.id);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    revalidatePath(`/admin`, `layout`);
    return { ok: true };
  });
}

export async function withdrawArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (articleData, actor) => {
    
            await db.update(article).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "WITHDRAW_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function approveArticle(id: string, notes?: string): Promise<ActionResponse> {
  return executeTransition(id, "APPROVED", async (articleData, actor) => {
    const selfGuard = await checkSelfReviewGuard(articleData, actor);
    if (!selfGuard.ok) return selfGuard as any;

    
            await db.update(article).set({ 
              status: "APPROVED",
              approvedAt: new Date(),
              approvedById: actor.id,
              reviewedAt: new Date(),
              reviewedById: actor.id,
              updatedAt: new Date()
            }).where(eq(article.id, id));
            
            const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(articleReview).where(eq(articleReview.articleId, id));
            const passNumber = count + 1;
            
            await db.insert(articleReview).values({
              id: crypto.randomUUID(),
              articleId: id,
              reviewerId: actor.id,
              decision: "APPROVED",
              fromStatus: articleData.status,
              toStatus: "APPROVED",
              passNumber,
              reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${notes || ""}`.trim() : (notes || null)
            });

            if (selfGuard.isSelfReview) {
              await db.insert(auditLog).values({
                id: crypto.randomUUID(),
                userId: actor.id,
                action: "SELF_REVIEW",
                entityType: "Article",
                entityId: id,
                details: { decision: "APPROVED", reason: "no other reviewers available" }
              });
            }

            if (articleData.authorId) {
              const [authorUser] = await db.select({ id: user.id }).from(user).where(eq(user.authorId, articleData.authorId)).limit(1);
              if (authorUser && authorUser.id !== actor.id) {
                await db.insert(notification).values({
                  id: crypto.randomUUID(),
                  userId: authorUser.id,
                  message: `"${articleData.title || 'Untitled'}" was approved.`,
                  link: `/admin/editor/${id}`
                });
              }
            }
          

    await notifyApproved(articleData, actor.id);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function requestChanges(id: string, reason: string): Promise<ActionResponse> {
  return executeTransition(id, "REVISION_REQUESTED", async (articleData, actor) => {
    if (!reason || reason.trim().length < 20) {
      return { ok: false, code: "VALIDATION", message: "A reason of at least 20 characters is required to request changes." };
    }

    const selfGuard = await checkSelfReviewGuard(articleData, actor);
    if (!selfGuard.ok) return selfGuard as any;

    
            await db.update(article).set({ 
              status: "REVISION_REQUESTED",
              reviewedAt: new Date(),
              reviewedById: actor.id,
              updatedAt: new Date()
            }).where(eq(article.id, id));
            
            const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(articleReview).where(eq(articleReview.articleId, id));
            const passNumber = count + 1;
            
            await db.insert(articleReview).values({
              id: crypto.randomUUID(),
              articleId: id,
              reviewerId: actor.id,
              decision: "CHANGES_REQUESTED",
              fromStatus: articleData.status,
              toStatus: "REVISION_REQUESTED",
              passNumber,
              reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${reason}` : reason
            });

            if (selfGuard.isSelfReview) {
              await db.insert(auditLog).values({
                id: crypto.randomUUID(),
                userId: actor.id,
                action: "SELF_REVIEW",
                entityType: "Article",
                entityId: id,
                details: { decision: "CHANGES_REQUESTED", reason: "no other reviewers available" }
              });
            }

            if (articleData.authorId) {
              const [authorUser] = await db.select({ id: user.id }).from(user).where(eq(user.authorId, articleData.authorId)).limit(1);
              if (authorUser && authorUser.id !== actor.id) {
                await db.insert(notification).values({
                  id: crypto.randomUUID(),
                  userId: authorUser.id,
                  message: `Changes requested on "${articleData.title || 'Untitled'}": ${reason.trim().slice(0, 140)}`,
                  link: `/admin/editor/${id}`
                });
              }
            }
          

    await notifyChangesRequested(articleData, actor.id, reason);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function rejectArticle(id: string, reason: string, reasonCode: string): Promise<ActionResponse> {
  return executeTransition(id, "REJECTED", async (articleData, actor) => {
    if (!reason || reason.trim().length < 20) {
      return { ok: false, code: "VALIDATION", message: "A reason of at least 20 characters is required for rejection." };
    }
    if (!reasonCode) {
      return { ok: false, code: "VALIDATION", message: "A reason code is required." };
    }

    const selfGuard = await checkSelfReviewGuard(articleData, actor);
    if (!selfGuard.ok) return selfGuard as any;

    
            await db.update(article).set({ 
              status: "REJECTED",
              reviewedAt: new Date(),
              reviewedById: actor.id,
              updatedAt: new Date()
            }).where(eq(article.id, id));
            
            const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(articleReview).where(eq(articleReview.articleId, id));
            const passNumber = count + 1;
            
            await db.insert(articleReview).values({
              id: crypto.randomUUID(),
              articleId: id,
              reviewerId: actor.id,
              decision: "REJECTED",
              fromStatus: articleData.status,
              toStatus: "REJECTED",
              passNumber,
              reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${reason}` : reason,
              reasonCode
            });

            if (selfGuard.isSelfReview) {
              await db.insert(auditLog).values({
                id: crypto.randomUUID(),
                userId: actor.id,
                action: "SELF_REVIEW",
                entityType: "Article",
                entityId: id,
                details: { decision: "REJECTED", reason: "no other reviewers available" }
              });
            }

            if (articleData.authorId) {
              const [authorUser] = await db.select({ id: user.id }).from(user).where(eq(user.authorId, articleData.authorId)).limit(1);
              if (authorUser && authorUser.id !== actor.id) {
                await db.insert(notification).values({
                  id: crypto.randomUUID(),
                  userId: authorUser.id,
                  message: `"${articleData.title || 'Untitled'}" was rejected: ${reason.trim().slice(0, 140)}`,
                  link: `/admin/editor/${id}`
                });
              }
            }
          

    await notifyRejected(articleData, actor.id, reason);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function reopenArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (articleData, actor) => {
    
            await db.update(article).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "REOPEN_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function publishArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "PUBLISHED", async (articleData, actor) => {
    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(article).where(and(eq(article.id, id), eq(article.status, articleData.status)));
    if (count > 0) {
      await db.update(article).set({ 
        status: "PUBLISHED",
        publishedAt: new Date(),
        scheduledFor: null,
        updatedAt: new Date()
      }).where(eq(article.id, id));
    }

    if (count === 0) {
      return { ok: false, code: "CONFLICT", message: "Article was modified just now." };
    }

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: actor.id,
      action: "PUBLISH_ARTICLE",
      entityType: "Article",
      entityId: id
    });

    await notifyPublished(articleData, actor.id);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    revalidatePath(`/admin`, `layout`);
    revalidateArticleRoutes(articleData as any);
    return { ok: true };
  });
}

export async function unpublishArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (articleData, actor) => {
    
            await db.update(article).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "UNPUBLISH_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    await notifyUnpublished(articleData, actor.id);

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    revalidateArticleRoutes(articleData as any);
    return { ok: true };
  });
}

export async function scheduleArticle(id: string, date: Date): Promise<ActionResponse> {
  return executeTransition(id, "SCHEDULED", async (articleData, actor) => {
    if (new Date(date) <= new Date()) {
      return { ok: false, code: "VALIDATION", message: "Scheduled date must be in the future." };
    }

    
            await db.update(article).set({ 
              status: "SCHEDULED",
              scheduledFor: new Date(date),
              updatedAt: new Date()
            }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "SCHEDULE_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function cancelSchedule(id: string): Promise<ActionResponse> {
  return executeTransition(id, "APPROVED", async (articleData, actor) => {
    
            await db.update(article).set({ 
              status: "APPROVED",
              scheduledFor: null,
              updatedAt: new Date()
            }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "UNSCHEDULE_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function archiveArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "ARCHIVED", async (articleData, actor) => {
    
            await db.update(article).set({ 
              status: "ARCHIVED",
              archivedAt: new Date(),
              updatedAt: new Date()
            }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "ARCHIVE_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    revalidateArticleRoutes(articleData as any);
    return { ok: true };
  });
}

export async function restoreArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (articleData, actor) => {
    
            await db.update(article).set({ status: "DRAFT", updatedAt: new Date() }).where(eq(article.id, id));
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "RESTORE_ARTICLE",
              entityType: "Article",
              entityId: id
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    revalidateArticleRoutes(articleData as any);
    return { ok: true };
  });
}

export async function deleteArticlePermanently(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  
  if (!authorize(actor.role, "article.delete")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions to permanently delete." };
  }

  const articleData = await getArticle(id);
  if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
  
  if (articleData.status !== "ARCHIVED") {
    return { ok: false, code: "FORBIDDEN", message: "Only archived articles can be permanently deleted. Please archive the article first." };
  }

  try {
    if (articleData.img) await deleteFileFromR2(articleData.img);
    if (articleData.contentUrl) {
      try {
        const payload = await fetchFromR2(articleData.contentUrl);
        if (payload) {
          const config = getR2Config();
          if (!("error" in config)) {
            const publicBase = config.publicBase;
            const imageUrls = new Set<string>();
            
            if (payload.json) {
              const str = JSON.stringify(payload.json);
              const regex = /"src":\s*"([^"]+)"/g;
              let match;
              while ((match = regex.exec(str)) !== null) {
                if (match[1].startsWith(publicBase)) imageUrls.add(match[1]);
              }
            }
            if (payload.html) {
              const regex = /src=["']([^"']+)["']/g;
              let match;
              while ((match = regex.exec(payload.html)) !== null) {
                if (match[1].startsWith(publicBase)) imageUrls.add(match[1]);
              }
            }

            for (const url of imageUrls) {
              await deleteFileFromR2(url);
            }
          }
        }
      } catch (e) {
        console.error("Failed deep R2 deletion for permanent delete:", e);
      }
      await deleteKeyFromR2(articleData.contentUrl);
    }

    
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "DELETE_ARTICLE_PERMANENTLY",
              entityType: "Article",
              entityId: id,
              details: { title: articleData.title, slug: articleData.slug, authorId: articleData.authorId, status: articleData.status }
            });
            
            await db.delete(articleReview).where(eq(articleReview.articleId, id));
            await db.delete(articleRevision).where(eq(articleRevision.articleId, id));
            await db.delete(comment).where(eq(comment.articleSlug, articleData.slug));
            
            await db.delete(article).where(eq(article.id, id));
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/article/${articleData.slug}`);
    revalidatePath(`/`);
    revalidatePath(`/sitemap.xml`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, code: "SERVER", message: e.message };
  }
}

export async function deleteOwnDraft(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  
  if (!authorize(actor.role, "article.delete.own.draft") && !authorize(actor.role, "article.delete")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions." };
  }

  const articleData = await getArticle(id);
  if (!articleData) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  if (articleData.status !== "DRAFT") {
    return { ok: false, code: "FORBIDDEN", message: "Only drafts can be deleted this way." };
  }

  if (articleData.authorId !== actor.authorId && !authorize(actor.role, "article.delete")) {
    return { ok: false, code: "FORBIDDEN", message: "You can only delete your own drafts." };
  }

  try {
    if (articleData.img) await deleteFileFromR2(articleData.img);
    if (articleData.contentUrl) {
      try {
        const payload = await fetchFromR2(articleData.contentUrl);
        if (payload) {
          const config = getR2Config();
          if (!("error" in config)) {
            const publicBase = config.publicBase;
            const imageUrls = new Set<string>();
            
            if (payload.json) {
              const str = JSON.stringify(payload.json);
              const regex = /"src":\s*"([^"]+)"/g;
              let match;
              while ((match = regex.exec(str)) !== null) {
                if (match[1].startsWith(publicBase)) imageUrls.add(match[1]);
              }
            }
            if (payload.html) {
              const regex = /src=["']([^"']+)["']/g;
              let match;
              while ((match = regex.exec(payload.html)) !== null) {
                if (match[1].startsWith(publicBase)) imageUrls.add(match[1]);
              }
            }

            for (const url of imageUrls) {
              await deleteFileFromR2(url);
            }
          }
        }
      } catch (e) {
        console.error("Failed deep R2 deletion for own draft:", e);
      }
      await deleteKeyFromR2(articleData.contentUrl);
    }

    
            await db.delete(articleReview).where(eq(articleReview.articleId, id));
            await db.delete(articleRevision).where(eq(articleRevision.articleId, id));
            await db.delete(article).where(eq(article.id, id));
            
            await db.insert(auditLog).values({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "DELETE_OWN_DRAFT",
              entityType: "Article",
              entityId: id,
              details: { title: articleData.title }
            });
          

    revalidatePath(`/admin/articles`);
    revalidatePath(`/article/${articleData.slug}`);
    revalidatePath(`/`);
    revalidatePath(`/sitemap.xml`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, code: "SERVER", message: e.message };
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Bulk operations
// ──────────────────────────────────────────────────────────────────────────────
// Clearing a backlog one row at a time is the single most repetitive thing in
// this console: archiving forty stale drafts meant forty menu-open-confirm
// cycles. Bulk fixes that without loosening anything.
//
// Two rules shape the implementation.
//
// First, every article is validated individually through validateTransition,
// exactly as the single-article actions do. There is no bulk fast path that
// skips the state machine, because a bulk endpoint that trusts the client's
// list is an authorization hole -- the ids arrive from the browser and an
// actor could name articles they cannot see.
//
// Second, it does NOT run in one transaction. A single failing article should
// not roll back thirty-nine legitimate ones; the user would have no idea which
// of the forty was the problem. Instead each is attempted and the result
// reports exactly what succeeded and what did not, so the UI can say "37
// archived, 3 skipped" and name them.

export type BulkOutcome = {
  id: string;
  title: string;
  ok: boolean;
  message?: string;
};

export type BulkResponse = ActionResponse<{
  succeeded: number;
  failed: number;
  outcomes: BulkOutcome[];
}>;

// Capped because the ids come from a checkbox selection on one page of results.
// A request naming thousands is either a bug or someone probing the endpoint,
// and either way it should not run a thousand sequential writes.
const BULK_LIMIT = 100;

async function runBulkTransition(
  ids: string[],
  to: ArticleStatus
): Promise<BulkResponse> {
  const actor = await getActor();
  if (!actor) {
    return { ok: false, code: "UNAUTHENTICATED", message: "You are not signed in." };
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, code: "VALIDATION", message: "No articles selected." };
  }

  // De-duplicate: a malformed selection repeating an id would otherwise be
  // attempted twice and double-count in the summary.
  const unique = Array.from(new Set(ids));

  if (unique.length > BULK_LIMIT) {
    return {
      ok: false,
      code: "VALIDATION",
      message: `Select at most ${BULK_LIMIT} articles at a time.`,
    };
  }

  const outcomes: BulkOutcome[] = [];
  const touchedSlugs: string[] = [];
  let publishedAffected = false;

  // One read for the whole selection instead of N sequential findUnique calls.
  //
  // At the 50-article bulk limit that was fifty round-trips to Postgres before
  // any work started, each waiting on the last. The authorization and
  // transition checks below still run per article -- they have to, since the
  // whole point is that some may legitimately be rejected -- but they now run
  // against rows already in memory.
  type BulkRow = {
    id: string;
    status: ArticleStatus;
    authorId: string | null;
    reviewedById: string | null;
    title: string;
    slug: string;
    categoryId: string | null;
    category: { slug: string } | null;
    authorModel: { slug: string } | null;
    deck: string | null;
    contentUrl: string | null;
  };

  const found = await db.query.article.findMany({
    where: inArray(article.id, unique),
    columns: { id: true, status: true, authorId: true, reviewedById: true, title: true, slug: true, categoryId: true, deck: true, contentUrl: true },
    with: { category: { columns: { slug: true } }, authorModel: { columns: { slug: true } } }
  }) as BulkRow[];
  const byId = new Map<string, BulkRow>(found.map((a: any) => [a.id, a]));

  // Writes are accumulated and issued together once every article has been
  // checked. Each is still an independent decision, so this is not an
  // all-or-nothing transaction: a rejected article simply contributes no write.
  const updates: ((tx: any) => Promise<any>)[] = [];
  const auditRows: any[] = [];

  for (const id of unique) {
    const articleLocal = byId.get(id);

    if (!articleLocal) {
      outcomes.push({ id, title: "Unknown article", ok: false, message: "Not found." });
      continue;
    }

    const forTransition: ArticleForTransition = {
      status: articleLocal.status,
      authorId: articleLocal.authorId,
    };

    const error = validateTransition(articleLocal.status, to, actor, forTransition);
    if (error) {
      outcomes.push({ id, title: articleLocal.title, ok: false, message: error });
      continue;
    }

    const data: any = { status: to as any };
    if (to === "ARCHIVED") data.archivedAt = new Date();
    if (to === "DRAFT") {
      data.archivedAt = null;
    }

    updates.push((tx: any) => tx.update(article).set(data).where(eq(article.id, id)));
    auditRows.push({
      id: crypto.randomUUID(),
      userId: actor.id,
      action: `BULK_${to}`,
      entityType: "Article",
      entityId: id,
      details: { from: articleLocal.status, to, title: articleLocal.title },
    });

    if (articleLocal.status === "PUBLISHED" || to === "PUBLISHED") {
      publishedAffected = true;
      if (articleLocal.slug) touchedSlugs.push(articleLocal.slug);
    }

    outcomes.push({ id, title: articleLocal.title, ok: true });
  }

  if (updates.length > 0) {
    try {
      
                for (const up of updates) await up(db);
                if (auditRows.length > 0) {
                  await db.insert(auditLog).values(auditRows);
                }
              
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Update failed.";
      return {
        ok: true,
        data: {
          succeeded: 0,
          failed: outcomes.length,
          outcomes: outcomes.map((o) =>
            o.ok ? { ...o, ok: false as const, message } : o
          ),
        },
      };
    }
  }

  const succeeded = outcomes.filter((o) => o.ok).length;

  revalidatePath("/admin/articles");
  // Only flush the public cache if something public actually moved -- archiving
  // a pile of drafts has no reader-facing effect and should not invalidate the
  // whole site.
  if (publishedAffected) {
    // @ts-ignore
    revalidateTag(CACHE_TAGS.articles);
    for (const slug of touchedSlugs) {
      // @ts-ignore
      revalidateTag(articleTag(slug));
      revalidatePath(`/article/${slug}`, "page");
    }
  }

  return {
    ok: true,
    data: { succeeded, failed: outcomes.length - succeeded, outcomes },
  };
}

export async function bulkArchive(ids: string[]): Promise<BulkResponse> {
  return runBulkTransition(ids, "ARCHIVED");
}

export async function bulkRestore(ids: string[]): Promise<BulkResponse> {
  return runBulkTransition(ids, "DRAFT");
}

export async function bulkPublish(ids: string[]): Promise<BulkResponse> {
  return runBulkTransition(ids, "PUBLISHED");
}

export async function bulkSubmit(ids: string[]): Promise<BulkResponse> {
  return runBulkTransition(ids, "SUBMITTED");
}

// ──────────────────────────────────────────────────────────────────────────────
// Bulk permanent deletion
// ──────────────────────────────────────────────────────────────────────────────
//
// Separate from runBulkTransition rather than folded into it, because this is
// not a transition. The others move a status and are reversible -- an archived
// article can be restored, an unpublished one republished. This destroys rows,
// and the article, its revisions, its review history and its comments go with
// it. Sharing a code path would make it too easy for a future change to the
// generic runner to widen what deletion accepts.
//
// It enforces exactly the same conditions as the two single-article delete
// actions, per article, so bulk is a convenience over the existing rules and
// never a way around them:
//
//   * ARCHIVED         -> requires "article.delete"          (OWNER, ADMIN)
//   * DRAFT, own       -> requires "article.delete.own.draft"
//   * anything else    -> refused, with the reason reported
//
// A published article is never deletable here. Archiving first is a deliberate
// speed bump: it takes the story off the public site and gives the newsroom a
// reversible state to sit in before anything is destroyed.
// ──────────────────────────────────────────────────────────────────────────────

export async function bulkDelete(ids: string[]): Promise<BulkResponse> {
  const actor = await getActor();
  if (!actor) {
    return { ok: false, code: "UNAUTHENTICATED", message: "You are not signed in." };
  }

  const canDeleteArchived = authorize(actor.role, "article.delete");
  const canDeleteOwnDraft = authorize(actor.role, "article.delete.own.draft");

  // Refuse the whole call if the actor cannot delete anything at all, rather
  // than returning a list of identical per-article refusals.
  if (!canDeleteArchived && !canDeleteOwnDraft) {
    return {
      ok: false,
      code: "FORBIDDEN",
      message: "You do not have permission to delete articles.",
    };
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    return { ok: false, code: "VALIDATION", message: "No articles selected." };
  }

  const unique = Array.from(new Set(ids));

  if (unique.length > BULK_LIMIT) {
    return {
      ok: false,
      code: "VALIDATION",
      message: `Select at most ${BULK_LIMIT} articles at a time.`,
    };
  }

  type DeleteRow = {
    id: string;
    status: ArticleStatus;
    authorId: string | null;
    title: string;
    slug: string;
  };

  const found = await db.select({ id: article.id, status: article.status, authorId: article.authorId, title: article.title, slug: article.slug })
    .from(article)
    .where(inArray(article.id, unique));
  const byId = new Map<string, any>(found.map((a: any) => [a.id, a]));

  const outcomes: BulkOutcome[] = [];
  const deletable: DeleteRow[] = [];

  for (const id of unique) {
    const article = byId.get(id);

    if (!article) {
      // Same answer for "does not exist" and "not yours to see", so the
      // response cannot be used to probe for ids.
      outcomes.push({ id, title: "Unknown article", ok: false, message: "Not found." });
      continue;
    }

    if (article.status === "ARCHIVED") {
      if (!canDeleteArchived) {
        outcomes.push({
          id,
          title: article.title,
          ok: false,
          message: "You cannot permanently delete archived articles.",
        });
        continue;
      }
      deletable.push(article);
      continue;
    }

    if (article.status === "DRAFT") {
      // Ownership is checked against the actor's author record, not the
      // session, and not the client payload.
      const isOwn = Boolean(actor.authorId) && article.authorId === actor.authorId;

      // An account that can delete any archived article can also clear out
      // drafts; anyone else is limited to their own.
      if (!canDeleteArchived && !(canDeleteOwnDraft && isOwn)) {
        outcomes.push({
          id,
          title: article.title,
          ok: false,
          message: "You can only delete your own drafts.",
        });
        continue;
      }
      deletable.push(article);
      continue;
    }

    outcomes.push({
      id,
      title: article.title,
      ok: false,
      message:
        article.status === "PUBLISHED"
          ? "Published articles must be archived before they can be deleted."
          : `Only drafts and archived articles can be deleted (this one is ${article.status.toLowerCase().replace("_", " ")}).`,
    });
  }

  if (deletable.length === 0) {
    return {
      ok: true,
      data: { succeeded: 0, failed: outcomes.length, outcomes },
    };
  }

  const deletableIds = deletable.map((a) => a.id);
  const deletableSlugs = deletable.map((a) => a.slug);

  try {
    
            const auditPayload = deletable.map((a) => ({
              id: crypto.randomUUID(),
              userId: actor.id,
              action: "BULK_DELETE_ARTICLE",
              entityType: "Article",
              entityId: a.id,
              details: { title: a.title, slug: a.slug, status: a.status, authorId: a.authorId },
            }));
            if (auditPayload.length > 0) {
              await db.insert(auditLog).values(auditPayload);
            }
            if (deletableIds.length > 0) {
              await db.delete(articleReview).where(inArray(articleReview.articleId, deletableIds));
              await db.delete(articleRevision).where(inArray(articleRevision.articleId, deletableIds));
              await db.delete(article).where(inArray(article.id, deletableIds));
            }
            if (deletableSlugs.length > 0) {
              await db.delete(comment).where(inArray(comment.articleSlug, deletableSlugs));
            }
          

    for (const a of deletable) {
      outcomes.push({ id: a.id, title: a.title, ok: true });
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Delete failed.";
    // The transaction rolled back, so nothing was deleted. Report the accepted
    // ones as failed rather than leaving them unaccounted for.
    for (const a of deletable) {
      outcomes.push({ id: a.id, title: a.title, ok: false, message });
    }
    return {
      ok: true,
      data: { succeeded: 0, failed: outcomes.length, outcomes },
    };
  }

  revalidatePath("/admin/articles");
  // Neither drafts nor archived articles are on the public site, so the reader
  // -facing cache is untouched. Only the console listing changes.

  const succeeded = outcomes.filter((o) => o.ok).length;
  return {
    ok: true,
    data: { succeeded, failed: outcomes.length - succeeded, outcomes },
  };
}
