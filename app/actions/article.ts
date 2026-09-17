"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ArticleStatus, Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canPublishArticle, canDeleteArticle } from "@/lib/permissions";
import { sanitizeArticleHtml, isValidSafeUrl, ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";

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
        select: { id: true, authorId: true, updatedAt: true, status: true, publishedAt: true }
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
    if (existingArticle && data.lastUpdatedAt && !data.isAutosave) {
      const clientDate = new Date(data.lastUpdatedAt);
      if (existingArticle.updatedAt > clientDate) {
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

    if (data.img && !isValidSafeUrl(data.img, ALLOWED_MEDIA_DOMAINS)) {
      return { success: false, error: "Featured image URL is invalid or from an unapproved domain." };
    }

    const categorySlug = (data.cat || "technology").toLowerCase().trim();
    
    // Find category
    let category = await db.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return { success: false, error: "Invalid category selected." };
    }

    const uniqueSlug = await getUniqueSlug(data.slug || data.title, data.id);

    let statusVal: ArticleStatus = data.status?.toUpperCase() || "DRAFT";
    
    // Role-based logic for Publishing
    const publishPolicy = canPublishArticle(dbUser.role as Role);
    if (statusVal === "PUBLISHED" && !publishPolicy.success) {
      statusVal = "SUBMITTED";
    }

    let publishedAt = existingArticle?.publishedAt || null;
    let scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;

    if (statusVal === "PUBLISHED" && !publishedAt) {
      // First time publishing
      publishedAt = new Date();
    }
    
    // Clear scheduled time if published immediately or reverted to draft
    if (statusVal === "PUBLISHED" || statusVal === "DRAFT") {
      scheduledFor = null;
    }

    const sanitizedBodyHtml = sanitizeArticleHtml(data.bodyHtml);

    const payload = {
      title: data.title.trim(),
      slug: uniqueSlug,
      deck: data.deck || null,
      contentHtml: sanitizedBodyHtml || null,
      contentJson: data.bodyJson || null,
      author: data.author?.trim() || user.name || "xCipher Staff",
      role: data.role?.trim() || user.role || null,
      status: statusVal,
      featured: Boolean(data.featured),
      img: data.img || null,
      seoTitle: data.seoTitle || null,
      seoDesc: data.seoDesc || null,

      homepagePlacement: data.homepagePlacement || null,
      categoryId: category.id,
      // Strictly enforce authorId from session/DB, don't trust client payload for Authors
      authorId: dbUser.role === "AUTHOR" ? userWithAuth.authorId : (data.authorId || userWithAuth.authorId || null), 
      publishedAt,
      scheduledFor,
    };

    let article;
    let actionType = "";
    let existingArticleStatus = "NEW";

    const tagsData = Array.isArray(data.tags) ? data.tags.filter(Boolean).map((slug: string) => ({ slug })) : [];

    if (data.id) {
      const existingArticle = await db.article.findUnique({ where: { id: data.id }, select: { slug: true, status: true } });
      existingArticleStatus = existingArticle?.status || "NEW";
      // Compute slug history for redirect safety
      const currentPreviousSlugs: string[] = (existingArticle as any)?.previousSlugs || [];
      const updatedPreviousSlugs = existingArticle && existingArticle.slug !== uniqueSlug
        ? Array.from(new Set([...currentPreviousSlugs, existingArticle.slug]))
        : currentPreviousSlugs;

      article = await db.article.update({
        where: { id: data.id },
        data: {
          ...payload,
          previousSlugs: updatedPreviousSlugs,
          tags: { set: tagsData }
        },
        include: { category: true },
      });
      actionType = `UPDATE_ARTICLE_${statusVal}`;
    } else {
      article = await db.article.create({
        data: {
          ...payload,
          tags: tagsData.length > 0 ? { connect: tagsData } : undefined
        },
        include: { category: true },
      });
      actionType = `CREATE_ARTICLE_${statusVal}`;
    }

    // Always create an immutable revision snapshot
    await db.articleRevision.create({
      data: {
        articleId: article.id,
        userId: user.id,
        title: article.title,
        deck: article.deck,
        contentHtml: article.contentHtml,
        contentJson: article.contentJson ? JSON.parse(JSON.stringify(article.contentJson)) : null,
        notes: data.notes || null,
        statusChange: existingArticleStatus !== statusVal ? `${existingArticleStatus} -> ${statusVal}` : null,
      }
    });

    await logAudit(actionType, "Article", article.id, { title: article.title, status: statusVal });

    // Revalidate relevant pages
    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin", "layout");
      revalidatePath("/admin/drafts", "page");
      revalidatePath("/admin/articles", "page");
      revalidatePath(`/article/${article.slug}`, "page");
      if (category.slug) {
        revalidatePath(`/category/${category.slug}`, "page");
      }
      revalidatePath("/latest", "page");
      revalidatePath("/search", "page");
    } catch (revalError) {
      console.warn(">>> [SERVER] Revalidation error:", revalError);
    }

    return { success: true, article };
  } catch (error: any) {
    console.error(">>> [SERVER] Save failed with error:", error.message);
    return { success: false, error: error.message || "Failed to save article" };
  }
}

export async function deleteArticle(id: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthenticated" };
    }

    const deletePolicy = canDeleteArticle(user.role as Role);
    if (!deletePolicy.success) {
      return { success: false, error: deletePolicy.error };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Invalid article ID" };
    }

    const article = await db.article.delete({
      where: { id },
      include: { category: true },
    });

    await logAudit("DELETE_ARTICLE", "Article", id, { title: article.title });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/admin", "layout");
      revalidatePath("/admin/drafts", "page");
      revalidatePath("/admin/articles", "page");
      if (article.category?.slug) {
        revalidatePath(`/category/${article.category.slug}`, "page");
      }
      revalidatePath("/latest", "page");
      revalidatePath("/search", "page");
    } catch (revalError) {
      console.warn(">>> [SERVER] Revalidation error:", revalError);
    }

    return { success: true };
  } catch (error: any) {
    console.error(">>> [SERVER] Delete failed:", error.message);
    return { success: false, error: error.message || "Failed to delete article" };
  }
}
