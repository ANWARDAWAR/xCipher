"use server";

import { db } from "@/lib/db";
import { article, auditLog, category, articleRevision, _articleToTag, tag, benchmarkLeaderboard } from "@/lib/db/schema";
import { eq, inArray, or, and, not, sql } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "@/lib/revalidate";
import { articleMutationTags } from "@/lib/cache-tags";
import { getCurrentUser } from "@/lib/auth";
import { canEditArticle } from "@/lib/permissions";
import { sanitizeArticleHtml, isValidSafeUrl } from "@/lib/sanitize";
import { calculateReadTime, deriveIsFeatured } from "@/lib/utils";
import { authorize } from "@/lib/capabilities";
import { handleServerError } from "@/lib/errors";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { headers } from "next/headers";
import { after } from "next/server";
import { uploadToR2, deleteKeyFromR2 } from "@/lib/storage";

import type { Role } from "@/lib/types";

// Do not return the article's full search text over Neon HTTP and serialize
// it again in the save response. Revisions and the editor only need metadata.
const savedArticleColumns = {
  id: article.id,
  slug: article.slug,
  title: article.title,
  deck: article.deck,
  contentUrl: article.contentUrl,
  authorId: article.authorId,
  isAnonymous: article.isAnonymous,
  status: article.status,
  updatedAt: article.updatedAt,
};
type SavedArticle = Pick<typeof article.$inferSelect, keyof typeof savedArticleColumns>;

async function logAudit(action: string, entityType: string, entityId?: string, details?: unknown, actorId?: string) {
  try {
    const userId = actorId ?? (await getCurrentUser())?.id ?? null;
    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId,
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

    // getCurrentUser already checks the database for the active user's role,
    // authorId and sessionVersion. Do not decode the session or fetch it again.
    const userWithAuth = {
      id: userSession.id,
      role: userSession.role as Role,
      authorId: userSession.authorId,
    };

    let existingArticle = null;
    if (data.id) {
      existingArticle = await db.query.article.findFirst({
        where: eq(article.id, data.id),
        columns: { id: true, authorId: true, isAnonymous: true, updatedAt: true, status: true, publishedAt: true, slug: true, previousSlugs: true, contentUrl: true }
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

    if (data.isAnonymous !== undefined && typeof data.isAnonymous !== "boolean") {
      return { success: false, error: "Anonymous publication must be a boolean." };
    }

    const categorySlug = (data.cat || "technology").toLowerCase().trim();
    
    const [catRecord] = await db.select({ id: category.id }).from(category).where(eq(category.slug, categorySlug)).limit(1);

    if (!catRecord) {
      return { success: false, error: "Invalid category selected." };
    }

    const uniqueSlug = existingArticle && data.slug === existingArticle.slug
      ? existingArticle.slug
      : await getUniqueSlug(data.slug || data.title, data.id);
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
      isAnonymous: data.isAnonymous ?? existingArticle?.isAnonymous ?? false,
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
    let finalArticle: SavedArticle;

    const tagsData: { slug: string }[] = Array.isArray(data.tags) ? data.tags.filter(Boolean).map((s: string) => ({ slug: s })) : [];

    try {
      // neon-http is a one-shot driver and does not support interactive
      // transactions. Keep these writes ordered and remove the newly uploaded
      // R2 object if any database step fails.
      if (tagsData.length > 0) {
        await db.insert(tag).values(tagsData.map(t => ({ id: crypto.randomUUID(), slug: t.slug, name: t.slug }))).onConflictDoNothing({ target: tag.slug });
      }

      const tagRecs = tagsData.length > 0
        ? await db.select({ id: tag.id }).from(tag).where(inArray(tag.slug, tagsData.map(t => t.slug)))
        : [];

      if (data.id) {
        existingArticleStatus = existingArticle?.status || "NEW";
        let finalStatusUpdate: "SUBMITTED" | undefined;
        if (!authorize(userWithAuth.role, "article.publish") && ["PUBLISHED", "APPROVED", "SCHEDULED"].includes(existingArticleStatus)) {
          finalStatusUpdate = "SUBMITTED";
        }

        const currentPreviousSlugs = existingArticle?.previousSlugs || [];
        const updatedPreviousSlugs = existingArticle && existingArticle.slug !== uniqueSlug
          ? Array.from(new Set([...currentPreviousSlugs, existingArticle.slug]))
          : currentPreviousSlugs;

        const [updated] = await db.update(article).set({
          ...payload,
          ...(finalStatusUpdate ? { status: finalStatusUpdate } : {}),
          previousSlugs: updatedPreviousSlugs,
        }).where(eq(article.id, data.id)).returning(savedArticleColumns);

        await db.delete(_articleToTag).where(eq(_articleToTag.A, updated.id));
        if (tagRecs.length > 0) {
          await db.insert(_articleToTag).values(tagRecs.map(tr => ({ A: updated.id, B: tr.id })));
        }

        finalArticle = updated;
        actionType = finalStatusUpdate ? `DEMOTED_TO_${finalStatusUpdate}` : `UPDATE_ARTICLE_${updated.status}`;
      } else {
        const resolvedAuthorId = authorize(userWithAuth.role, "article.publish")
          ? (data.authorId || userWithAuth.authorId || null)
          : userWithAuth.authorId;

        const [created] = await db.insert(article).values({
          id: articleId,
          ...payload,
          authorId: resolvedAuthorId,
        }).returning(savedArticleColumns);

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

    await logAudit(actionType, "Article", finalArticle.id, { title: finalArticle.title, status: finalArticle.status }, userSession.id);

    // Keep durable content, metadata, revisions and audit writes above. Next's
    // after() uses the platform request lifetime for secondary work; it does
    // not grant an additional Cloudflare CPU allowance.
    after(async () => {
      if (finalArticle.status === "PUBLISHED" && data.bodyJson) {
        try {
          const bodyObj = typeof data.bodyJson === "string" ? JSON.parse(data.bodyJson) : data.bodyJson;
          const metricsToUpsert: (typeof benchmarkLeaderboard.$inferInsert)[] = [];
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
            await revalidateTag('benchmark-leaderboard', 'max');
          }
        } catch (err) {
          console.error("Error processing benchmark leaderboard", err);
        }
      }

      const invalidations = [
        revalidatePath(`/admin/editor/${finalArticle.id}`),
        revalidatePath("/admin/drafts"),
        revalidatePath("/admin/articles"),
      ];
      // Draft autosaves cannot affect a public page. Avoid discarding the
      // publication's caches or every route under its root layout for them.
      if (finalArticle.status === "PUBLISHED" || existingArticle?.status === "PUBLISHED") {
        const slugs = new Set([finalArticle.slug, existingArticle?.slug].filter((slug): slug is string => !!slug));
        const tags = new Set([...slugs].flatMap(slug => articleMutationTags({ slug })));
        invalidations.push(
          ...[...tags].map(tag => revalidateTag(
            tag,
            // Expire cached real bylines when an editorial desk is involved.
            payload.isAnonymous || existingArticle?.isAnonymous ? { expire: 0 } : 'max',
          )),
          ...[...slugs].map(slug => revalidatePath(`/article/${slug}`, "page")),
          revalidatePath("/", "page"),
          revalidatePath("/sitemap.xml"),
          revalidatePath("/feed.xml"),
        );
      }
      await Promise.all(invalidations);
    });

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
    }, userSession.id);

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
