"use server";

import { db } from "@/lib/db";
import { getActor } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { ArticleStatus, Role } from "@prisma/client";
import { validateTransition, TRANSITIONS, ArticleForTransition } from "@/lib/workflow";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = any> =
  | { ok: true; data?: T }
  | { ok: false; code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "VALIDATION" | "RATE_LIMITED" | "SERVER"; message: string };

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

async function getArticle(id: string) {
  return await db.article.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      authorId: true,
      reviewedById: true,
      title: true,
      slug: true,
      categoryId: true,
      deck: true,
      contentHtml: true,
    }
  });
}

async function checkSelfReviewGuard(article: any, actor: any) {
  if (article.authorId && actor.authorId && article.authorId === actor.authorId) {
    const activeReviewersCount = await db.user.count({
      where: { isActive: true, role: { in: ["OWNER", "ADMIN", "EDITOR", "REVIEWER", "MODERATOR"] } }
    });
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
    const article = await getArticle(id);
    if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
    if (article.reviewedById && article.reviewedById !== actor.id) {
      return { ok: false, code: "CONFLICT", message: "Article is already claimed by another reviewer." };
    }

    const { count } = await db.article.updateMany({
      where: { id, reviewedById: null, status: article.status },
      data: { reviewedById: actor.id }
    });

    if (count === 0) {
      return { ok: false, code: "CONFLICT", message: "Article was claimed by another reviewer just now." };
    }

    await db.auditLog.create({
      data: { userId: actor.id, action: "CLAIM_REVIEW", entityType: "Article", entityId: id }
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
  
  const article = await getArticle(id);
  if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
  
  if (article.reviewedById !== actor.id) {
    return { ok: false, code: "FORBIDDEN", message: "You cannot release an article you have not claimed." };
  }

  await db.article.update({
    where: { id },
    data: { reviewedById: null }
  });

  await db.auditLog.create({
    data: { userId: actor.id, action: "RELEASE_REVIEW", entityType: "Article", entityId: id }
  });

  revalidatePath(`/admin/review`);
  revalidatePath(`/admin/review/${id}`);
  return { ok: true };
}

export async function takeOverReview(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  if (!authorize(actor.role, "article.review")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions." };
  }

  const article = await getArticle(id);
  if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  await db.article.update({
    where: { id },
    data: { reviewedById: actor.id }
  });

  await db.auditLog.create({
    data: { userId: actor.id, action: "TAKEOVER_REVIEW", entityType: "Article", entityId: id, details: { previousReviewerId: article.reviewedById } }
  });

  revalidatePath(`/admin/review`);
  revalidatePath(`/admin/review/${id}`);
  return { ok: true };
}

// ──────────────────────────────────────────────────────────────────────────────
// Transitions
// ──────────────────────────────────────────────────────────────────────────────

async function executeTransition(
  id: string,
  to: ArticleStatus,
  actionFn: (article: any, actor: any) => Promise<ActionResponse>
): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };

  const article = await getArticle(id);
  if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  const validationError = validateTransition(article.status, to, actor, article);
  if (validationError) {
    return { ok: false, code: "FORBIDDEN", message: validationError };
  }

  return await actionFn(article, actor);
}

export async function submitArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "SUBMITTED", async (article, actor) => {
    if (!article.title?.trim()) {
      return { ok: false, code: "VALIDATION", message: "Title is required for submission." };
    }
    if (!article.deck || article.deck.trim().length < 10) {
      return { ok: false, code: "VALIDATION", message: "A short description (deck) of at least 10 characters is required." };
    }
    if (!article.categoryId) {
      return { ok: false, code: "VALIDATION", message: "Category is required." };
    }
    const textContent = article.contentHtml?.replace(/<[^>]+>/g, '').trim() || "";
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    if (wordCount < 50) {
      return { ok: false, code: "VALIDATION", message: `Content must be at least 50 words. Currently: ${wordCount}` };
    }

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "SUBMITTED", 
          submittedAt: new Date(),
          submittedById: actor.id
        }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "SUBMIT_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function withdrawArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { status: "DRAFT" }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "WITHDRAW_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function approveArticle(id: string, notes?: string): Promise<ActionResponse> {
  return executeTransition(id, "APPROVED", async (article, actor) => {
    const selfGuard = await checkSelfReviewGuard(article, actor);
    if (!selfGuard.ok) return selfGuard as any;

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "APPROVED",
          approvedAt: new Date(),
          approvedById: actor.id,
          reviewedAt: new Date(),
          reviewedById: actor.id
        }
      });
      
      const passNumber = await tx.articleReview.count({ where: { articleId: id } }) + 1;
      
      await tx.articleReview.create({
        data: {
          articleId: id,
          reviewerId: actor.id,
          decision: "APPROVED",
          fromStatus: article.status,
          toStatus: "APPROVED",
          passNumber,
          reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${notes || ""}`.trim() : (notes || null)
        }
      });

      if (selfGuard.isSelfReview) {
        await tx.auditLog.create({
          data: { userId: actor.id, action: "SELF_REVIEW", entityType: "Article", entityId: id, details: { decision: "APPROVED", reason: "no other reviewers available" } }
        });
      }
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function requestChanges(id: string, reason: string): Promise<ActionResponse> {
  return executeTransition(id, "REVISION_REQUESTED", async (article, actor) => {
    if (!reason || reason.trim().length < 20) {
      return { ok: false, code: "VALIDATION", message: "A reason of at least 20 characters is required to request changes." };
    }

    const selfGuard = await checkSelfReviewGuard(article, actor);
    if (!selfGuard.ok) return selfGuard as any;

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "REVISION_REQUESTED",
          reviewedAt: new Date(),
          reviewedById: actor.id
        }
      });
      
      const passNumber = await tx.articleReview.count({ where: { articleId: id } }) + 1;
      
      await tx.articleReview.create({
        data: {
          articleId: id,
          reviewerId: actor.id,
          decision: "CHANGES_REQUESTED",
          fromStatus: article.status,
          toStatus: "REVISION_REQUESTED",
          passNumber,
          reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${reason}` : reason
        }
      });

      if (selfGuard.isSelfReview) {
        await tx.auditLog.create({
          data: { userId: actor.id, action: "SELF_REVIEW", entityType: "Article", entityId: id, details: { decision: "CHANGES_REQUESTED", reason: "no other reviewers available" } }
        });
      }
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function rejectArticle(id: string, reason: string, reasonCode: string): Promise<ActionResponse> {
  return executeTransition(id, "REJECTED", async (article, actor) => {
    if (!reason || reason.trim().length < 20) {
      return { ok: false, code: "VALIDATION", message: "A reason of at least 20 characters is required for rejection." };
    }
    if (!reasonCode) {
      return { ok: false, code: "VALIDATION", message: "A reason code is required." };
    }

    const selfGuard = await checkSelfReviewGuard(article, actor);
    if (!selfGuard.ok) return selfGuard as any;

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "REJECTED",
          reviewedAt: new Date(),
          reviewedById: actor.id
        }
      });
      
      const passNumber = await tx.articleReview.count({ where: { articleId: id } }) + 1;
      
      await tx.articleReview.create({
        data: {
          articleId: id,
          reviewerId: actor.id,
          decision: "REJECTED",
          fromStatus: article.status,
          toStatus: "REJECTED",
          passNumber,
          reason: selfGuard.isSelfReview ? `[Self-review: no other reviewers] ${reason}` : reason,
          reasonCode
        }
      });

      if (selfGuard.isSelfReview) {
        await tx.auditLog.create({
          data: { userId: actor.id, action: "SELF_REVIEW", entityType: "Article", entityId: id, details: { decision: "REJECTED", reason: "no other reviewers available" } }
        });
      }
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function reopenArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { status: "DRAFT" }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "REOPEN_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function publishArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "PUBLISHED", async (article, actor) => {
    const { count } = await db.article.updateMany({
      where: { id, status: article.status },
      data: { 
        status: "PUBLISHED",
        publishedAt: new Date(),
        scheduledFor: null
      }
    });

    if (count === 0) {
      return { ok: false, code: "CONFLICT", message: "Article was modified just now." };
    }

    await db.auditLog.create({
      data: { userId: actor.id, action: "PUBLISH_ARTICLE", entityType: "Article", entityId: id }
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/review`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function unpublishArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { status: "DRAFT" }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "UNPUBLISH_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function scheduleArticle(id: string, date: Date): Promise<ActionResponse> {
  return executeTransition(id, "SCHEDULED", async (article, actor) => {
    if (new Date(date) <= new Date()) {
      return { ok: false, code: "VALIDATION", message: "Scheduled date must be in the future." };
    }

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "SCHEDULED",
          scheduledFor: new Date(date)
        }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "SCHEDULE_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function cancelSchedule(id: string): Promise<ActionResponse> {
  return executeTransition(id, "APPROVED", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "APPROVED",
          scheduledFor: null
        }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "UNSCHEDULE_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function archiveArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "ARCHIVED", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { 
          status: "ARCHIVED",
          archivedAt: new Date()
        }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "ARCHIVE_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function restoreArticle(id: string): Promise<ActionResponse> {
  return executeTransition(id, "DRAFT", async (article, actor) => {
    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id },
        data: { status: "DRAFT" }
      });
      await tx.auditLog.create({
        data: { userId: actor.id, action: "RESTORE_ARTICLE", entityType: "Article", entityId: id }
      });
    });

    revalidatePath(`/admin/articles`);
    revalidatePath(`/admin/editor/${id}`);
    return { ok: true };
  });
}

export async function deleteArticlePermanently(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  
  if (!authorize(actor.role, "article.delete")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions to permanently delete." };
  }

  const article = await getArticle(id);
  if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };
  
  if (article.status !== "ARCHIVED") {
    return { ok: false, code: "FORBIDDEN", message: "Only archived articles can be permanently deleted. Please archive the article first." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: { userId: actor.id, action: "DELETE_ARTICLE_PERMANENTLY", entityType: "Article", entityId: id, details: { title: article.title, slug: article.slug, authorId: article.authorId, status: article.status } }
      });
      
      await tx.articleReview.deleteMany({ where: { articleId: id } });
      await tx.articleRevision.deleteMany({ where: { articleId: id } });
      await tx.comment.deleteMany({ where: { articleSlug: article.slug } });
      
      await tx.article.delete({ where: { id } });
    });

    revalidatePath(`/admin/articles`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, code: "SERVER", message: e.message };
  }
}

export async function deleteOwnDraft(id: string): Promise<ActionResponse> {
  const actor = await getActor();
  if (!actor) return { ok: false, code: "UNAUTHENTICATED", message: "Sign in required." };
  
  if (!authorize(actor.role, "article.delete.own.draft")) {
    return { ok: false, code: "FORBIDDEN", message: "Insufficient permissions." };
  }

  const article = await getArticle(id);
  if (!article) return { ok: false, code: "NOT_FOUND", message: "Article not found." };

  if (article.status !== "DRAFT" || article.authorId !== actor.authorId) {
    return { ok: false, code: "FORBIDDEN", message: "You can only delete your own drafts." };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.articleReview.deleteMany({ where: { articleId: id } });
      await tx.articleRevision.deleteMany({ where: { articleId: id } });
      await tx.article.delete({ where: { id } });
      
      await tx.auditLog.create({
        data: { userId: actor.id, action: "DELETE_OWN_DRAFT", entityType: "Article", entityId: id, details: { title: article.title } }
      });
    });

    revalidatePath(`/admin/articles`);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, code: "SERVER", message: e.message };
  }
}
