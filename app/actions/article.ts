"use server";

import { db } from "@/lib/db";
import { article, auditLog, category, articleRevision, _articleToTag, user, author, tag, benchmarkLeaderboard } from "@/lib/db/schema";
import { eq, inArray, or, and, not, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { articleMutationTags } from "@/lib/cache-tags";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle, canPublishArticle, canDeleteArticle } from "@/lib/permissions";
import { sanitizeArticleHtml, isValidSafeUrl, getAllowedMediaDomains } from "@/lib/sanitize";
import { calculateReadTime, deriveIsFeatured } from "@/lib/utils";
import { authorize } from "@/lib/capabilities";
import { handleServerError } from "@/lib/errors";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { uploadToR2, deleteKeyFromR2 } from "@/lib/storage";

import { Role } from "@/lib/types";

async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  try {
    const userSession = await getCurrentUser();
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: userSession?.id || null,
      action,
      entityType,
      entityId: entityId || null,
      details,
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
    const [existing] = await db.select({ id: article.id }).from(article).where(eq(article.slug, candidate)).limit(1);
    if (!existing || (currentId && existing.id === currentId)) {
      return candidate;
    }
    candidate = `${slug}-${count}`;
    count++;
  }
}

export async function upsertArticle(data: any) {
  try {
    const userSession = await getCurrentUser();
    if (!userSession) {
      return { success: false, error: "Unauthenticated" };
    }

    const dbUser = await db.query.user.findFirst({
      where: eq(user.id, userSession.id),
      with: { authorProfile: true }
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
      existingArticle = await db.query.article.findFirst({
        where: eq(article.id, data.id),
        columns: { id: true, authorId: true, updatedAt: true, status: true, publishedAt: true, slug: true, contentUrl: true }
      });
      if (!existingArticle) {
        return { success: false, error: "Article not found" };
      }
    }

    const editPolicy = canEditArticle(userWithAuth, existingArticle || undefined);
    if (!editPolicy.success) {
      return { success: false, error: editPolicy.error };
    }

    if (existingArticle && data.lastUpdatedAt && !data.isAutosave && existingArticle.status !== "DRAFT") {
      const clientDate = new Date(data.lastUpdatedAt);
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
    
    const [catRecord] = await db.select().from(category).where(eq(category.slug, categorySlug)).limit(1);

    if (!catRecord) {
      return { success: false, error: "Invalid category selected." };
    }

    const uniqueSlug = await getUniqueSlug(data.slug || data.title, data.id);
    const articleId = data.id || crypto.randomUUID();

    const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : null;
    const sanitizedBodyHtml = sanitizeArticleHtml(data.bodyHtml);

    let contentUrl = existingArticle?.contentUrl || null;
    if (sanitizedBodyHtml || data.bodyJson) {
      const contentPayload = JSON.stringify({
        html: sanitizedBodyHtml || "",
        json: data.bodyJson || null,
      });
      const key = `articles/content-${articleId}.json`;
      contentUrl = await uploadToR2(key, contentPayload, "application/json");
    }

    const payload = {
      title: data.title.trim(),
      slug: uniqueSlug,
      status: data.status || "DRAFT",
      deck: data.deck || null,
      contentUrl,
      textContent: typeof sanitizedBodyHtml === 'string' ? sanitizedBodyHtml.replace(/<[^>]*>?/gm, ' ') : null,
      author: data.author?.trim() || userSession.name || "xSypher Staff",
      role: data.role?.trim() || userSession.role || null,
      featured: typeof data.featured === "boolean" ? data.featured : deriveIsFeatured(data.homepagePlacement || null),
      img: data.img || null,
      seoTitle: data.seoTitle || null,
      seoDesc: data.seoDesc || null,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      ogImage: data.ogImage || null,
      focusKeyword: data.focusKeyword || null,
      canonicalUrl: data.canonicalUrl || null,
      featuredImageAlt: data.featuredImageAlt || null,
      featuredImageCaption: data.featuredImageCaption || null,
      featuredImageCredit: data.featuredImageCredit || null,
      homepagePlacement: data.homepagePlacement || null,
      categoryId: catRecord.id,
      scheduledFor,
      readingTime: calculateReadTime(sanitizedBodyHtml || data.bodyHtml),
      updatedAt: new Date(),
      ...(data.authorId ? { authorId: data.authorId } : {}),
      ...(data.status === "PUBLISHED" && (!existingArticle || existingArticle.status !== "PUBLISHED") 
          ? { publishedAt: new Date() } 
          : {}),
    };

    if (payload.featured || payload.homepagePlacement === "featured" || payload.homepagePlacement === "HERO") {
      await db.update(article)
        .set({ featured: false, homepagePlacement: null, updatedAt: new Date() })
        .where(
          and(
            or(eq(article.featured, true), eq(article.homepagePlacement, "featured"), eq(article.homepagePlacement, "HERO")),
            existingArticle?.id ? not(eq(article.id, existingArticle.id)) : undefined
          )
        );
    }

    let actionType = "";
    let existingArticleStatus = "NEW";
    let finalArticle: any;

    const tagsData = Array.isArray(data.tags) ? data.tags.filter(Boolean).map((s: string) => ({ slug: s })) : [];

    try {
      // neon-http is a one-shot driver and does not support interactive
      // transactions. Keep these writes ordered and remove the newly uploaded
      // R2 object if any database step fails.
      for (const t of tagsData) {
        await db.insert(tag).values({ id: crypto.randomUUID(), slug: t.slug, name: t.slug }).onConflictDoNothing({ target: tag.slug });
      }

      const tagRecs = tagsData.length > 0
        ? await db.select({ id: tag.id }).from(tag).where(inArray(tag.slug, tagsData.map((t: any) => t.slug)))
        : [];

      if (data.id) {
        existingArticleStatus = existingArticle?.status || "NEW";
        let finalStatusUpdate = undefined;
        if (dbUser.role === "AUTHOR" && ["PUBLISHED", "APPROVED", "SCHEDULED"].includes(existingArticleStatus)) {
          finalStatusUpdate = "SUBMITTED";
        }

        const currentPreviousSlugs: string[] = (existingArticle as any)?.previousSlugs || [];
        const updatedPreviousSlugs = existingArticle && existingArticle.slug !== uniqueSlug
          ? Array.from(new Set([...currentPreviousSlugs, existingArticle.slug]))
          : currentPreviousSlugs;

        const [updated] = await db.update(article).set({
          ...payload,
          ...(finalStatusUpdate ? { status: finalStatusUpdate as any } : {}),
          previousSlugs: updatedPreviousSlugs,
        }).where(eq(article.id, data.id)).returning();

        await db.delete(_articleToTag).where(eq(_articleToTag.A, updated.id));
        if (tagRecs.length > 0) {
          await db.insert(_articleToTag).values(tagRecs.map(tr => ({ A: updated.id, B: tr.id })));
        }

        finalArticle = updated;
        actionType = finalStatusUpdate ? `DEMOTED_TO_${finalStatusUpdate}` : `UPDATE_ARTICLE_${updated.status}`;
      } else {
        const resolvedAuthorId = dbUser.role === "AUTHOR" ? userWithAuth.authorId : (data.authorId || userWithAuth.authorId || null);

        const [created] = await db.insert(article).values({
          id: articleId,
          ...payload,
          authorId: resolvedAuthorId,
        }).returning();

        if (tagRecs.length > 0) {
          await db.insert(_articleToTag).values(tagRecs.map(tr => ({ A: created.id, B: tr.id })));
        }

        finalArticle = created;
        actionType = `CREATE_ARTICLE_${created.status}`;
      }

      if (!data.isAutosave) {
        await db.insert(articleRevision).values({
          id: crypto.randomUUID(),
          articleId: finalArticle.id,
          userId: userSession.id,
          title: finalArticle.title,
          deck: finalArticle.deck,
          contentUrl: finalArticle.contentUrl,
          notes: data.notes || null,
          statusChange: null,
          createdAt: new Date(),
        });
      }
    } catch (dbErr) {
      if (contentUrl && contentUrl !== existingArticle?.contentUrl) {
        await deleteKeyFromR2(contentUrl).catch(console.error);
      }
      throw dbErr;
    }

    await logAudit(actionType, "Article", finalArticle.id, { title: finalArticle.title, status: finalArticle.status });

    if (finalArticle.status === "PUBLISHED" && data.bodyJson) {
      try {
        const bodyObj = typeof data.bodyJson === "string" ? JSON.parse(data.bodyJson) : data.bodyJson;
        const metricsToUpsert: any[] = [];
        const extractScores = (node: any) => {
          if (node.type === "scoreBreakdownBlock" && node.attrs?.items) {
            try {
              const items = typeof node.attrs.items === "string" ? JSON.parse(node.attrs.items) : node.attrs.items;
              for (const item of items) {
                if (item.tab && item.subCategory && item.metric && typeof item.score === "number") {
                  metricsToUpsert.push({
                    id: crypto.randomUUID(),
                    category: item.tab,
                    subCategory: item.subCategory,
                    metric: item.metric,
                    topScore: item.score,
                    deviceName: finalArticle.title,
                    articleId: finalArticle.id,
                    updatedAt: new Date()
                  });
                }
              }
            } catch (e) {
              console.error("Failed to parse items in scoreBreakdownBlock", e);
            }
          }
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach(extractScores);
          }
        };
        extractScores(bodyObj);

        if (metricsToUpsert.length > 0) {
          for (const metric of metricsToUpsert) {
            await db.insert(benchmarkLeaderboard).values(metric).onConflictDoUpdate({
              target: [benchmarkLeaderboard.category, benchmarkLeaderboard.subCategory, benchmarkLeaderboard.metric],
              set: {
                topScore: metric.topScore,
                deviceName: metric.deviceName,
                articleId: metric.articleId,
                updatedAt: metric.updatedAt,
              },
              where: sql`${benchmarkLeaderboard.topScore} < ${metric.topScore}`,
            });
          }
          revalidateTag('benchmark-leaderboard', 'max');
        }
      } catch (err) {
        console.error("Error processing benchmark leaderboard", err);
      }
    }

    await Promise.all([
      ...articleMutationTags({ slug: finalArticle.slug }).map(tag => revalidateTag(tag, 'max')),
      revalidatePath("/", "layout"),
      revalidatePath("/admin", "layout"),
      revalidatePath(`/article/${finalArticle.slug}`, "page"),
      revalidatePath("/sitemap.xml"),
    ]);

    return { success: true, article: finalArticle };
  } catch (error: any) {
    return handleServerError(error, "Failed to save article");
  }
}

export async function restoreRevision(revisionId: string) {
  const userSession = await getCurrentUser();
  if (!userSession) return { success: false, error: "Unauthorized" };

  try {
    const rev = await db.query.articleRevision.findFirst({
      where: eq(articleRevision.id, revisionId),
      with: {
        article: {
          columns: { id: true, slug: true, title: true, status: true, authorId: true },
        },
      },
    });

    if (!rev || !rev.article) return { success: false, error: "Revision not found" };

    const articleData = rev.article;

    const policy = canEditArticle(
      { id: userSession.id, role: userSession.role as Role, authorId: userSession.authorId },
      { id: articleData.id, authorId: articleData.authorId }
    );
    if (!policy.success) {
      return { success: false, error: policy.error || "Unauthorized" };
    }

    if (articleData.status === "PUBLISHED") {
      return {
        success: false,
        error: "This article is published. Unpublish it before restoring an earlier version, so the change is reviewed before readers see it.",
      };
    }

    const restoredUrl = rev.contentUrl;

      await db.update(article).set({
        title: rev.title ?? articleData.title,
        deck: rev.deck,
        contentUrl: restoredUrl,
        updatedAt: new Date(),
      }).where(eq(article.id, articleData.id));

      await db.insert(articleRevision).values({
        id: crypto.randomUUID(),
        articleId: articleData.id,
        userId: userSession.id,
        title: rev.title ?? articleData.title,
        deck: rev.deck,
        contentUrl: restoredUrl,
        notes: `Restored the version saved on ${new Date(rev.createdAt).toLocaleString("en-US")}.`,
        statusChange: null,
        createdAt: new Date(),
      });

    await logAudit("RESTORE_REVISION", "Article", articleData.id, {
      revisionId,
      revisionCreatedAt: rev.createdAt,
      title: rev.title,
    });

    revalidatePath(`/admin/articles/${articleData.id}`);
    revalidatePath(`/admin/editor/${articleData.id}`);
    revalidatePath("/admin/articles");

    return { success: true, articleId: articleData.id };
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

    // In Drizzle we can increment with sql`...`
    await db.update(article)
      .set({ views: sql`${article.views} + 1` })
      .where(eq(article.id, id));

    return { success: true };
  } catch (error) {
    return handleServerError(error, "Failed to increment view");
  }
}
