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

/** Latest groups into Today / Yesterday / This week / Earlier. */
export const LATEST_ARTICLE_LIMIT = 60;

/** Category and author listings. */
export const LISTING_ARTICLE_LIMIT = 40;
