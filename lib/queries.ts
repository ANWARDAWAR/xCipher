// ──────────────────────────────────────────────────────────────────────────────
// Shared Drizzle columns and with blocks for article lists
// ──────────────────────────────────────────────────────────────────────────────
//
// Every public list page used to select all columns including contentHtml and contentJson.
// A single published article's body is routinely tens of kilobytes,
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
export const ARTICLE_CARD_COLUMNS = {
  id: true,
  slug: true,
  title: true,
  deck: true,
  img: true,
  author: true,
  role: true,
  views: true,
  readingTime: true,
  featured: true,
  status: true,
  createdAt: true,
  publishedAt: true,
  homepagePlacement: true,
  categoryId: true,
} as const;

export const ARTICLE_CARD_WITH = {
  category: { 
    columns: { 
      id: true, 
      name: true, 
      slug: true,
    },
    with: {
      parent: { columns: { id: true, name: true, slug: true } }
    }
  },
  authorModel: { columns: { avatar: true, name: true, slug: true } },
} as const;

/** Card fields plus tag chips, for the tag and search listings. */
export const ARTICLE_CARD_WITH_TAGS_WITH = {
  ...ARTICLE_CARD_WITH,
  tags: { 
    with: {
      tag: { columns: { id: true, name: true, slug: true } }
    }
  },
} as const;

/** Card fields plus the author profile, for author pages and bylines. */
export const ARTICLE_CARD_WITH_AUTHOR_WITH = {
  ...ARTICLE_CARD_WITH,
  authorModel: { columns: { id: true, name: true, slug: true, avatar: true } },
} as const;

// ──────────────────────────────────────────────────────────────────────────────
// Page sizes
//
// The homepage, latest, category and author listings previously fetched every
// matching row with no `limit` at all. That is unbounded: the query cost grows
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

/**
 * Ceiling for the editorial review queue. The queue is meant to be worked down
 * to empty, so this is a safety limit rather than a paging window.
 */
export const REVIEW_QUEUE_LIMIT = 100;
