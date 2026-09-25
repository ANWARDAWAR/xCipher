"use server";

import { db } from "@/lib/db";
import { revalidatePath, updateTag } from "next/cache";
import { articleMutationTags } from "@/lib/cache-tags";
import { ArticleStatus, Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canPublishArticle, canDeleteArticle } from "@/lib/permissions";
import { sanitizeArticleHtml, isValidSafeUrl, ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import { calculateReadTime, deriveIsFeatured } from "@/lib/utils";
import { authorize } from "@/lib/capabilities";
import { handleServerError } from "@/lib/errors";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { headers } from "next/headers";

async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const user = await getCurrentUser();
    await db.auditLog.create({
      data: {
        userId: user?.id || null,
        action,
        entityType,
        entityId,
        details,
      }
    });
  } catch (e) {
    console.error("Failed to log audit event:", e);
  }
}

async function getUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
  let slug = baseSlug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug) slug = "article-" + Math.floor(Math.random() * 10000);

  let candidate = slug;
  let count = 1;
  while (true) {
    const existing = await db.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (currentId && existing.id === currentId)) {
      return candidate;
    }
    candidate = `${slug}-${count}`;
    count++;
  }
}

export async function upsertArticle(data: any) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthenticated" };
    }

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      include: { authorProfile: true }
    });

    if (!dbUser) {
      return { success: false, error: "User record not found" };
    }

    const userWithAuth = {
      id: dbUser.id,
      role: dbUser.role as Role,
      authorId: dbUser.authorProfile?.id || null,
    };

    let existingArticle = null;
    if (data.id) {
      existingArticle = await db.article.findUnique({
        where: { id: data.id },
        select: { id: true, authorId: true, updatedAt: true, status: true, publishedAt: true, slug: true }
      });
      if (!existingArticle) {
        return { success: false, error: "Article not found" };
      }
    }

    const editPolicy = canEditArticle(userWithAuth, existingArticle || undefined);
    if (!editPolicy.success) {
      return { success: false, error: editPolicy.error };
    }

    // Concurrency check – skip on autosave (the editor's baseline will resync from the returned updatedAt)
    // Only block on explicit manual saves where the user could overwrite a co-author's changes
    // Bypass if the article is an initial draft to prevent false conflicts on first manual save.
    if (existingArticle && data.lastUpdatedAt && !data.isAutosave && existingArticle.status !== "DRAFT") {
      const clientDate = new Date(data.lastUpdatedAt);
      // Allow up to 1 second difference to account for timestamp precision mismatches 
      // between JavaScript Date (milliseconds) and PostgreSQL (microseconds)
      if (existingArticle.updatedAt.getTime() - clientDate.getTime() > 1000) {
        return { 
          success: false,
          serverUpdatedAt: existingArticle.updatedAt.toISOString(),
          error: "Conflict: This article has been modified by someone else since you opened it. Please refresh and integrate your changes." 
        };
      }
    }

    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      return { success: false, error: "Article title is required." };
    }

    if (data.img && !isValidSafeUrl(data.img)) {
      return { success: false, error: "Featured image URL is invalid." };
    }

    const categorySlug = (data.cat || "technology").toLowerCase().trim();
    
    // Find category
    const category = await db.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return { success: false, error: "Invalid category selected." };
    }

    const uniqueSlug = await getUniqueSlug(data.slug || data.title, data.id);

    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;


    const sanitizedBodyHtml = sanitizeArticleHtml(data.bodyHtml);

    const payload = {
      title: data.title.trim(),
      slug: uniqueSlug,
      status: data.status || "DRAFT",
      deck: data.deck || null,
      contentHtml: sanitizedBodyHtml || null,
      contentJson: data.bodyJson || null,
      author: data.author?.trim() || user.name || "xSypher Staff",
      role: data.role?.trim() || user.role || null,
      featured: typeof data.featured === "boolean" ? data.featured : deriveIsFeatured(data.homepagePlacement || null),
      img: data.img || null,
      seoTitle: data.seoTitle || null,
      seoDesc: data.seoDesc || null,

      homepagePlacement: data.homepagePlacement || null,
      categoryId: category.id,
      scheduledFor,
      readingTime: calculateReadTime(sanitizedBodyHtml || data.bodyHtml),
      ...(data.status === "PUBLISHED" && (!existingArticle || existingArticle.status !== "PUBLISHED") 
          ? { publishedAt: new Date() } 
          : {}),
    };

    let article;
    let actionType = "";
    let existingArticleStatus = "NEW";

    const tagsData = Array.isArray(data.tags) ? data.tags.filter(Boolean).map((slug: string) => ({ slug })) : [];
    if (data.id) {
      const existingArticleForStatus = await db.article.findUnique({ where: { id: data.id }, select: { slug: true, status: true } });
      existingArticleStatus = existingArticleForStatus?.status || "NEW";
      
      let finalStatusUpdate: ArticleStatus | undefined = undefined;
      // State Demotion logic
      if (dbUser.role === "AUTHOR" && ["PUBLISHED", "APPROVED", "SCHEDULED"].includes(existingArticleStatus)) {
        finalStatusUpdate = "SUBMITTED";
      }

      // Compute slug history for redirect safety
      const currentPreviousSlugs: string[] = (existingArticle as any)?.previousSlugs || [];
      const updatedPreviousSlugs = existingArticle && existingArticle.slug !== uniqueSlug
        ? Array.from(new Set([...currentPreviousSlugs, existingArticle.slug]))
        : currentPreviousSlugs;

      article = await db.article.update({
        where: { id: data.id },
        data: {
          ...payload,
          ...(finalStatusUpdate ? { status: finalStatusUpdate } : {}),
          previousSlugs: updatedPreviousSlugs,
          tags: { 
            set: [], // Clear existing tags to prevent unique constraint failures when changing tags
            connectOrCreate: tagsData.map((t: any) => ({
              where: { slug: t.slug },
              create: { slug: t.slug, name: t.slug }
            }))
          }
        },
        include: { category: true },
      });
      actionType = finalStatusUpdate ? `DEMOTED_TO_${finalStatusUpdate}` : `UPDATE_ARTICLE_${article.status}`;
    } else {
      const resolvedAuthorId = dbUser.role === "AUTHOR" ? userWithAuth.authorId : (data.authorId || userWithAuth.authorId || null);
      
      article = await db.article.create({
        data: {
          ...payload,
          authorId: resolvedAuthorId,
          tags: tagsData.length > 0 ? {
            connectOrCreate: tagsData.map((t: any) => ({
              where: { slug: t.slug },
              create: { slug: t.slug, name: t.slug }
            }))
          } : undefined
        },
        include: { category: true },
      });
      actionType = `CREATE_ARTICLE_${article.status}`;
    }

    // Do not create an immutable revision snapshot for autosaves
    if (!data.isAutosave) {
      await db.articleRevision.create({
        data: {
          articleId: article.id,
          userId: user.id,
          title: article.title,
          deck: article.deck,
          contentHtml: article.contentHtml,
          contentJson: article.contentJson ? JSON.parse(JSON.stringify(article.contentJson)) : null,
          notes: data.notes || null,
          statusChange: null,
        }
      });
    }

    await logAudit(actionType, "Article", article.id, { title: article.title, status: article.status });

    // Revalidate relevant pages
    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin", "layout");
      revalidatePath(`/article/${article.slug}`, "page");
      revalidatePath("/sitemap.xml");
    } catch (revalError) {
      console.warn(">>> [SERVER] Revalidation error:", revalError);
    }

    return { success: true, article };
  } catch (error: any) {
    return handleServerError(error, "Failed to save article");
  }
}


// ---------------------------------------------------------------------------
// Revision restore
// ---------------------------------------------------------------------------
// Snapshots have been written on every non-autosave save since the beginning,
// carrying the full title/deck/contentHtml/contentJson. Nothing ever read them
// back. So the history was visible but inert: an editor could see that a good
// version existed three saves ago and had no way to return to it.
//
// Restore is deliberately NOT a rollback that erases what came after. It copies
// the old snapshot forward into the live article and writes a new revision for
// the restore itself, so the timeline keeps growing in one direction and the
// version being replaced stays recoverable. A destructive rollback would make
// a misclick unrecoverable, which is the opposite of what version history is
// for.

export async function restoreRevision(revisionId: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const revision = await db.articleRevision.findUnique({
      where: { id: revisionId },
      include: {
        article: {
          select: { id: true, slug: true, title: true, status: true, authorId: true },
        },
      },
    });

    if (!revision) return { success: false, error: "Revision not found" };

    const article = revision.article;

    // Restoring rewrites the live article body, so it needs edit rights on that
    // specific article -- not merely the right to view its history. canEditArticle
    // resolves ownership too, so an author can roll back their own draft while
    // being unable to touch anyone else's.
    const policy = canEditArticle(
      { id: user.id, role: user.role, authorId: user.authorId },
      { id: article.id, authorId: article.authorId }
    );
    if (!policy.success) {
      return { success: false, error: policy.error || "Unauthorized" };
    }

    // A published article is live. Silently swapping its body from history is
    // a content change readers see immediately, and the workflow has explicit
    // transitions for taking something off the site. Refuse rather than
    // surprise: unpublish first, restore, then republish.
    if (article.status === "PUBLISHED") {
      return {
        success: false,
        error:
          "This article is published. Unpublish it before restoring an earlier version, so the change is reviewed before readers see it.",
      };
    }

    // Re-sanitize on the way back in. The snapshot was sanitized when written,
    // but the allowlist may have tightened since, and trusting stored HTML
    // because it was once clean is how an old payload survives a policy change.
    const restoredHtml = sanitizeArticleHtml(revision.contentHtml);

    await db.$transaction(async (tx) => {
      await tx.article.update({
        where: { id: article.id },
        data: {
          title: revision.title ?? article.title,
          deck: revision.deck,
          contentHtml: restoredHtml,
          contentJson: revision.contentJson
            ? JSON.parse(JSON.stringify(revision.contentJson))
            : null,
        },
      });

      // The restore is itself a revision. Without this the timeline would show
      // the article changing with no entry explaining why.
      await tx.articleRevision.create({
        data: {
          articleId: article.id,
          userId: user.id,
          title: revision.title ?? article.title,
          deck: revision.deck,
          contentHtml: restoredHtml,
          contentJson: revision.contentJson
            ? JSON.parse(JSON.stringify(revision.contentJson))
            : null,
          notes: `Restored the version saved on ${new Date(
            revision.createdAt
          ).toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}.`,
          statusChange: null,
        },
      });
    });

    await logAudit("RESTORE_REVISION", "Article", article.id, {
      revisionId,
      revisionCreatedAt: revision.createdAt,
      title: revision.title,
    });

    revalidatePath(`/admin/articles/${article.id}`);
    revalidatePath(`/admin/editor/${article.id}`);
    revalidatePath("/admin/articles");

    return { success: true, articleId: article.id };
  } catch (error: unknown) {
    return handleServerError(error, "Failed to restore revision");
  }
}

export async function incrementArticleView(id: string) {
  try {
    const reqHeaders = await headers();
    const ip = getClientIp(reqHeaders);
    const rl = await checkRateLimit("view", `${id}:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 });
    
    if (!rl.allowed) {
      return { success: false };
    }

    await db.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });
    // Deliberately avoiding revalidatePath here to prevent cache churn on every view.
    return { success: true };
  } catch (error) {
    return handleServerError(error, "Failed to increment view");
  }
}
