// ──────────────────────────────────────────────────────────────────────────────
// Shared Prisma selects for article lists
// ──────────────────────────────────────────────────────────────────────────────
//
// Every public list page used `include: { category: true }`, which is an
// implicit SELECT * on Article: it returns contentHtml and contentJson for
// every row. A single published article's body is routinely tens of kilobytes,
// and no card renders it -- the list components read title, deck, img, slug,
// author, category and a timestamp, and nothing else.
//
// Selecting explicitly is not a micro-optimisation here. On a homepage with a
// hundred published articles it is the difference between a few hundred
// kilobytes crossing the wire from Postgres and a few megabytes, on every
// request, for data that is then discarded.
//
// Keep these in one place so the next list page added cannot quietly
// reintroduce the full-row fetch.
// ──────────────────────────────────────────────────────────────────────────────

/** Everything a card or row needs, and nothing more. No body columns. */
export const ARTICLE_CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  deck: true,
  img: true,
  author: true,
  role: true,
  views: true,
  featured: true,
  status: true,
  createdAt: true,
  publishedAt: true,
  homepagePlacement: true,
  categoryId: true,
  category: { select: { id: true, name: true, slug: true } },
  authorModel: { select: { avatar: true, name: true, slug: true } },
} as const;

/** Card fields plus tag chips, for the tag and search listings. */
export const ARTICLE_CARD_WITH_TAGS_SELECT = {
  ...ARTICLE_CARD_SELECT,
  tags: { select: { id: true, name: true, slug: true } },
} as const;

/** Card fields plus the author profile, for author pages and bylines. */
export const ARTICLE_CARD_WITH_AUTHOR_SELECT = {
  ...ARTICLE_CARD_SELECT,
  authorModel: { select: { id: true, name: true, slug: true, avatar: true } },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Page sizes
//
// The homepage, latest, category and author listings previously fetched every
// matching row with no `take` at all. That is unbounded: the query cost grows
// with the archive forever, and the page renders slower every week it is left
// running. These caps are generous relative to what each layout actually
// displays, so nothing visible is lost today.
// ──────────────────────────────────────────────────────────────────────────────

/** The homepage layout fills lead, picks, grids and rails from one query. */
export const HOME_ARTICLE_LIMIT = 60;

/**
 * Page size for the paginated /latest wire. Grouping into Today / Yesterday /
 * This week / Earlier happens per page; ~30 keeps a page to roughly a day or
 * two of output on an active desk.
 */
export const LATEST_PAGE_SIZE = 30;

/** Page size for the paginated category and author listings. Matches the tag
 *  and search listings, which have always paginated at 20. */
export const LISTING_PAGE_SIZE = 20;

/**
 * Ceiling for the editorial review queue. The queue is meant to be worked down
 * to empty, so this is a safety limit rather than a paging window.
 */
export const REVIEW_QUEUE_LIMIT = 100;
