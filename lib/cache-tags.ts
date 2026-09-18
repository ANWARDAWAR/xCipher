// ─────────────────────────────────────────────────────────────────────────────
// Cache tags
// ─────────────────────────────────────────────────────────────────────────────
//
// One vocabulary for cache invalidation, shared by the pages that read and the
// server actions that write.
//
// The previous approach called revalidatePath("/", "layout") after any
// publication-affecting write. That is the broadest invalidation Next.js
// offers: it drops the cached output of every route under the root layout, so
// publishing one article discarded the homepage, every category, every tag,
// every author page and every other article. The next visitor to each of those
// paid a full re-render and a fresh set of queries.
//
// Tags let a write say what actually changed. Publishing an article touches
// article listings, so it invalidates `articles` and leaves the rest alone.
//
// Kept as functions rather than string literals at the call sites so a typo is
// a compile error instead of an invalidation that silently never fires -- the
// worst failure mode here, because nothing appears broken until a reader
// complains about stale content.
// ─────────────────────────────────────────────────────────────────────────────

export const CACHE_TAGS = {
  /** Any article list: homepage, /latest, category, tag, author, search. */
  articles: "articles",
  /** The taxonomy itself -- category and tag names, slugs, counts. */
  taxonomy: "taxonomy",
  /** Author profile records (name, bio, avatar), not their article lists. */
  authors: "authors",
  /** Publication-wide settings: site name, tagline, description. */
  settings: "settings",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** Tag for one article's own page, so a single story can be invalidated
 *  without dropping every listing that mentions it. */
export function articleTag(slug: string): string {
  return `article:${slug}`;
}

/** Tag for one category's listing. */
export function categoryTag(slug: string): string {
  return `category:${slug}`;
}

/** Tag for one author's profile page. */
export function authorTag(slug: string): string {
  return `author:${slug}`;
}

/**
 * The tags a publication-state change should invalidate.
 *
 * Collected in one place because the correct set is easy to get subtly wrong at
 * a call site -- forgetting the category tag leaves a published article missing
 * from its own section, which is exactly the kind of bug that surfaces days
 * later as "why isn't my story on the AI page".
 */
export function articleMutationTags(article: {
  slug?: string | null;
  category?: { slug?: string | null } | null;
  authorModel?: { slug?: string | null } | null;
}): string[] {
  const tags: string[] = [CACHE_TAGS.articles];
  if (article.slug) tags.push(articleTag(article.slug));
  if (article.category?.slug) tags.push(categoryTag(article.category.slug));
  if (article.authorModel?.slug) tags.push(authorTag(article.authorModel.slug));
  return tags;
}
