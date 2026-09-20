/**
 * lib/reading-time.ts
 *
 * Reading time used to be a hardcoded `5` on every article on the site
 * ("5 min read" on a 400-word brief and a 4,000-word investigation alike),
 * which the audit correctly flagged as fabrication. The schema has no
 * readingTime column, so the honest options are: compute it from the body
 * where the body is loaded, or show nothing where it is not.
 *
 * These helpers implement the first half of that. List cards (which
 * deliberately select no body columns -- see ARTICLE_CARD_SELECT) simply do
 * not render a reading time anymore.
 */

/** Words per minute: the conventional silent-reading rate used for editorial
 *  reading-time estimates (Medium, and most news sites, use 200-265). */
export const WORDS_PER_MINUTE_READ = 200;

/** Listening is slower than reading: TTS at a comfortable pace is ~150 wpm. */
export const WORDS_PER_MINUTE_LISTEN = 150;

/** Strips HTML to plain words and counts them. Entity-safe: `&amp;` counts as
 *  one word, and code blocks count their tokens like prose does -- close
 *  enough for an estimate, without pulling a parser into a render path. */
export function wordCountFromHtml(html: string | null | undefined): number {
  if (!html) return 0;
  const text = html
    // Drop tag contents that are not prose.
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // Decode only the entities that change word boundaries; leave the rest.
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"');
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words.length;
}

/** Estimated reading time in whole minutes, minimum 1 when there is content.
 *  Returns 0 for empty content so callers can decide to render nothing. */
export function readingMinutesFromHtml(html: string | null | undefined): number {
  const words = wordCountFromHtml(html);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE_READ));
}

/** Estimated listening time in whole minutes, for the audio player affordance. */
export function listeningMinutesFromHtml(html: string | null | undefined): number {
  const words = wordCountFromHtml(html);
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE_LISTEN));
}
