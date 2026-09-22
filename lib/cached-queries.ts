import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CACHE_TAGS, categoryTag, authorTag } from "./cache-tags";
import {
  ARTICLE_CARD_SELECT,
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
  async () =>
    db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" }
      ],
      take: HOME_ARTICLE_LIMIT,
      select: ARTICLE_CARD_SELECT,
    }),
  // Key parts. These queries take no arguments, so a static key is correct --
  // but it must still be distinct per query or two different listings would
  // share one cache entry.
  ["home-articles"],
  { tags: [CACHE_TAGS.articles], revalidate: 300 }
);

/** The /latest wire, newest first. */
export const getLatestArticles = unstable_cache(
  async () =>
    db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: LATEST_ARTICLE_LIMIT,
      select: ARTICLE_CARD_SELECT,
    }),
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
    async () =>
      db.article.findMany({
        where: { 
          status: "PUBLISHED", 
          category: subSlug 
            ? { slug: subSlug, parent: { slug } } 
            : {
                OR: [
                  { slug },
                  { parent: { slug } }
                ]
              }
        },
        orderBy: { createdAt: "desc" },
        take: LISTING_ARTICLE_LIMIT,
        select: ARTICLE_CARD_SELECT,
      }),
    ["category-articles", slug, subSlug || "all"],
    { tags: [CACHE_TAGS.articles, categoryTag(slug), ...(subSlug ? [categoryTag(subSlug)] : [])], revalidate: 300 }
  )();
}

/** Published articles by one author. */
export function getAuthorArticles(authorId: string, authorSlug: string) {
  return unstable_cache(
    async () =>
      db.article.findMany({
        where: { status: "PUBLISHED", authorId },
        orderBy: { createdAt: "desc" },
        take: LISTING_ARTICLE_LIMIT,
        select: ARTICLE_CARD_SELECT,
      }),
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
  async (limit: number = 50) =>
    db.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: { slug: true },
    }),
  ["recent-article-slugs"],
  { tags: [CACHE_TAGS.articles], revalidate: 3600 }
);
