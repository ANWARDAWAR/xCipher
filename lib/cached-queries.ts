import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CACHE_TAGS, categoryTag, authorTag } from "./cache-tags";
import { eq, desc, and } from "drizzle-orm";
import { article as articleTable } from "@/lib/db/schema";
import {
  ARTICLE_CARD_COLUMNS,
  ARTICLE_CARD_WITH,
  HOME_ARTICLE_LIMIT,
  LATEST_ARTICLE_LIMIT,
  LISTING_ARTICLE_LIMIT,
} from "./queries";

// ─────────────────────────────────────────────────────────────────────────────
// Tagged reads for public article listings
// ─────────────────────────────────────────────────────────────────────────────
//
// These wrap the listing queries in unstable_cache so their results can be
// invalidated by tag rather than by path.
//
// The reason is what the alternative costs. Publishing one article used to call
// revalidatePath("/", "layout"), which drops the cached output of every route
// under the root layout -- homepage, /latest, every category, every tag, every
// author page, every article. The next visitor to each of those pays a full
// re-render and a fresh round of queries. On a publication that ships several
// stories an hour, the cache is almost never warm.
//
// With tags, publishing invalidates `articles` and the specific category and
// author involved. Everything else stays warm.
//
// unstable_cache rather than the newer `cacheTag`: that one requires the
// experimental dynamicIO flag, which is not enabled here and would change the
// rendering model for the whole app. The "unstable" prefix is unfortunate but
// the API has been stable in practice across the 14/15/16 line, and it is what
// works with this configuration today.
//
// Note these cache the *query result*, which is a separate layer from the
// route-level `export const revalidate`. A page can therefore re-render (for
// example because a different tag was invalidated) and still reuse these rows
// without touching Postgres.
// ─────────────────────────────────────────────────────────────────────────────

/** Articles for the homepage, newest first. */
export const getHomeArticles = unstable_cache(
  async () => {
    try {
      return await db.query.article.findMany({
        where: eq(articleTable.status, "PUBLISHED"),
        orderBy: (a, { desc }) => [desc(a.publishedAt)],
        limit: HOME_ARTICLE_LIMIT,
        columns: ARTICLE_CARD_COLUMNS,
        with: ARTICLE_CARD_WITH,
      });
    } catch (error) {
      console.warn("[cached-queries] Failed to fetch home articles:", error);
      return [];
    }
  },
  // Key parts. These queries take no arguments, so a static key is correct --
  // but it must still be distinct per query or two different listings would
  // share one cache entry.
  ["home-articles"],
  { tags: [CACHE_TAGS.articles], revalidate: 300 }
);

/** The /latest wire, newest first. */
export const getLatestArticles = unstable_cache(
  async () => {
    try {
      return await db.query.article.findMany({
        where: eq(articleTable.status, "PUBLISHED"),
        orderBy: (a, { desc }) => [desc(a.publishedAt)],
        limit: LATEST_ARTICLE_LIMIT,
        columns: ARTICLE_CARD_COLUMNS,
        with: ARTICLE_CARD_WITH,
      });
    } catch (error) {
      console.warn("[cached-queries] Failed to fetch latest articles:", error);
      return [];
    }
  },
  ["latest-articles"],
  { tags: [CACHE_TAGS.articles], revalidate: 180 }
);

/**
 * Published articles in one category.
 *
 * The slug is both a key part and part of the tag: `categoryTag(slug)` lets a
 * single section be invalidated when an article lands in it, without dropping
 * the other twelve categories.
 */
export function getCategoryArticles(slug: string, subSlug?: string) {
  return unstable_cache(
    async () => {
      try {
        return await db.query.article.findMany({
          where: (a, { eq, and, or, sql }) => and(
            eq(a.status, "PUBLISHED"),
            sql`${a.categoryId} IN (SELECT id FROM "Category" WHERE slug = ${subSlug || slug} OR "parentId" IN (SELECT id FROM "Category" WHERE slug = ${slug}))`
          ),
          orderBy: (a, { desc }) => [desc(a.publishedAt)],
          limit: LISTING_ARTICLE_LIMIT,
          columns: ARTICLE_CARD_COLUMNS,
          with: ARTICLE_CARD_WITH,
        });
      } catch (error) {
        console.warn(`[cached-queries] Failed to fetch category articles for ${slug}:`, error);
        return [];
      }
    },
    ["category-articles", slug, subSlug || "all"],
    { tags: [CACHE_TAGS.articles, categoryTag(slug), ...(subSlug ? [categoryTag(subSlug)] : [])], revalidate: 300 }
  )();
}

/** Published articles by one author. */
export function getAuthorArticles(authorId: string, authorSlug: string) {
  return unstable_cache(
    async () => {
      try {
        return await db.query.article.findMany({
          where: and(eq(articleTable.status, "PUBLISHED"), eq(articleTable.authorId, authorId)),
          orderBy: (a, { desc }) => [desc(a.publishedAt)],
          limit: LISTING_ARTICLE_LIMIT,
          columns: ARTICLE_CARD_COLUMNS,
          with: ARTICLE_CARD_WITH,
        });
      } catch (error) {
        console.warn(`[cached-queries] Failed to fetch author articles for ${authorId}:`, error);
        return [];
      }
    },
    ["author-articles", authorId],
    { tags: [CACHE_TAGS.articles, authorTag(authorSlug)], revalidate: 600 }
  )();
}

/**
 * Slugs for generateStaticParams.
 *
 * Deliberately bounded. Pre-rendering every article would make build time grow
 * with the archive, and the long tail is not what readers arrive on. Recent
 * stories are pre-built; anything older renders on first request and is cached
 * from then on.
 */
export const getRecentArticleSlugs = unstable_cache(
  async (limit: number = 50) => {
    try {
      return await db.query.article.findMany({
        where: eq(articleTable.status, "PUBLISHED"),
        orderBy: (a, { desc }) => [desc(a.publishedAt)],
        limit: limit,
        columns: { slug: true },
      });
    } catch (error) {
      console.warn("[cached-queries] Failed to fetch recent article slugs:", error);
      return [];
    }
  },
  ["recent-article-slugs"],
  { tags: [CACHE_TAGS.articles], revalidate: 3600 }
);
