"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { ArticleStatus } from "@prisma/client";
import { getCurrentUser, requireRole } from "@/lib/auth";

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
    const user = await requireRole(["OWNER", "ADMIN", "EDITOR", "AUTHOR", "REVIEWER"]);

    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      return { success: false, error: "Article title is required." };
    }

    const categorySlug = (data.cat || "technology").toLowerCase().trim();
    
    // Find or create category fallback
    let category = await db.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      category = await db.category.create({
        data: {
          slug: categorySlug,
          name: categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1),
        },
      });
    }

    const uniqueSlug = await getUniqueSlug(data.slug || data.title, data.id);

    let statusVal: ArticleStatus = data.status?.toUpperCase() || "DRAFT";
    
    // Role-based logic for Publishing
    // Authors cannot publish directly; they can only submit for review
    if (statusVal === "PUBLISHED" && user.role === "AUTHOR") {
      statusVal = "SUBMITTED";
    }

    const payload = {
      title: data.title.trim(),
      slug: uniqueSlug,
      deck: data.deck || null,
      contentHtml: data.bodyHtml || null,
      contentJson: data.bodyJson || null,
      author: data.author?.trim() || user.name || "xCipher Staff",
      role: data.role?.trim() || user.role || null,
      status: statusVal,
      featured: Boolean(data.featured),
      img: data.img || null,
      seoTitle: data.seoTitle || null,
      seoDesc: data.seoDesc || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      categoryId: category.id,
      // If the user has an author profile, link it (assume user.authorId exists if so)
      authorId: data.authorId || null, 
    };

    let article;
    let actionType = "";

    if (data.id) {
      article = await db.article.update({
        where: { id: data.id },
        data: payload,
        include: { category: true },
      });
      actionType = `UPDATE_ARTICLE_${statusVal}`;
    } else {
      article = await db.article.create({
        data: payload,
        include: { category: true },
      });
      actionType = `CREATE_ARTICLE_${statusVal}`;
    }

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
    await requireRole(["OWNER", "ADMIN", "EDITOR"]);

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
