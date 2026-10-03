import { and, desc, eq, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { article } from "@/lib/db/schema";
import { ARTICLE_CARD_COLUMNS, ARTICLE_CARD_WITH } from "@/lib/queries";
import { maskPublicArticle } from "@/lib/personas";

export interface FeedFilter {
  categorySlug?: string;
  subcategorySlug?: string;
  tagSlug?: string;
  authorId?: string;
}

/** Shared by the initial render, counts, and subsequent pages. */
export function publicFeedWhere(filter: FeedFilter = {}) {
  return and(
    eq(article.status, "PUBLISHED"),
    or(isNull(article.publishedAt), lte(article.publishedAt, new Date())),
    filter.categorySlug
      ? filter.subcategorySlug
        ? sql`${article.categoryId} IN (SELECT id FROM "Category" WHERE slug = ${filter.subcategorySlug} AND "parentId" IN (SELECT id FROM "Category" WHERE slug = ${filter.categorySlug}))`
        : sql`${article.categoryId} IN (SELECT id FROM "Category" WHERE slug = ${filter.categorySlug} OR "parentId" IN (SELECT id FROM "Category" WHERE slug = ${filter.categorySlug}))`
      : undefined,
    filter.tagSlug
      ? sql`${article.id} IN (SELECT "A" FROM "_ArticleToTag" WHERE "B" IN (SELECT id FROM "Tag" WHERE slug = ${filter.tagSlug}))`
      : undefined,
    // Retain legacy articles whose byline predates the author relation.
    filter.authorId
      ? and(
          eq(article.isAnonymous, false),
          or(
            eq(article.authorId, filter.authorId),
            sql`${article.author} IN (SELECT name FROM "Author" WHERE id = ${filter.authorId} AND name <> '')`,
          ),
        )
      : undefined,
  );
}

export async function queryPublicFeed(offset: number, limit: number, filter: FeedFilter = {}) {
  const articles = await db.query.article.findMany({
    where: publicFeedWhere(filter),
    // The ID breaks timestamp ties so adjacent pages have a stable order.
    orderBy: [desc(article.publishedAt), desc(article.id)],
    offset,
    limit,
    columns: ARTICLE_CARD_COLUMNS,
    with: ARTICLE_CARD_WITH,
  });
  return articles.map(maskPublicArticle);
}

export type FeedArticle = Awaited<ReturnType<typeof queryPublicFeed>>[number];
