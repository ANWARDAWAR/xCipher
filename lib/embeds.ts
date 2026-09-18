// ─────────────────────────────────────────────────────────────────────────────
// Embed providers
// ─────────────────────────────────────────────────────────────────────────────
//
// One definition of what counts as an embeddable URL, shared by the three
// places that must agree on it:
//
//   1. the editor      — deciding whether a pasted URL becomes an embed
//   2. the sanitizer   — deciding whether an <iframe> survives to publication
//   3. the public page — rendering the published article
//
// If these three ever disagree the failure is silent and expensive: the editor
// shows a working video, the sanitizer strips the iframe on save, and the
// reader gets an empty gap. Keeping the rule in one pure module is what stops
// that. No imports, so it is unit-testable without a database or a DOM.
//
// Only YouTube is supported. Adding a provider means adding it here, and
// nowhere else, but it also means accepting that provider's iframe into
// published pages -- so the list stays deliberately short.
// ─────────────────────────────────────────────────────────────────────────────

/** Host that serves the embed player. Cookie-less variant: YouTube does not set
 *  tracking cookies until the reader actually plays the video. For a
 *  publication that is the right default, and it is not configurable. */
export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** A YouTube id is exactly 11 characters of [A-Za-z0-9_-]. Anchoring the
 *  pattern is what keeps a crafted path from smuggling anything else into the
 *  src we build. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/**
 * Pull the video id out of any YouTube URL shape we accept, or null.
 *
 * Accepts watch?v=, youtu.be/, /embed/, /shorts/ and /live/. Returns null for
 * everything else rather than guessing -- a channel or playlist URL should stay
 * a plain link, not silently become the wrong embed.
 */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  // A bare id, which is what our own renderHTML round-trips back to us.
  if (YOUTUBE_ID.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  // Protocol is checked before the host: javascript:// URLs can carry a
  // convincing-looking hostname.
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);

  // youtu.be/<id>
  if (url.hostname.toLowerCase().endsWith("youtu.be")) {
    return YOUTUBE_ID.test(segments[0] ?? "") ? segments[0] : null;
  }

  // /watch?v=<id>
  if (segments[0] === "watch") {
    const v = url.searchParams.get("v");
    return v && YOUTUBE_ID.test(v) ? v : null;
  }

  // /embed/<id>, /shorts/<id>, /live/<id>
  if (segments.length >= 2 && ["embed", "shorts", "live", "v"].includes(segments[0])) {
    return YOUTUBE_ID.test(segments[1]) ? segments[1] : null;
  }

  return null;
}

/** True when this URL should become an embed rather than stay a hyperlink. */
export function isYouTubeUrl(input: string | null | undefined): boolean {
  return parseYouTubeId(input) !== null;
}

/**
 * The only iframe src this application ever emits for a video.
 *
 * Built from a validated id rather than from the URL the author supplied, so
 * no part of their input reaches the attribute verbatim.
 */
export function youTubeEmbedSrc(id: string): string {
  if (!YOUTUBE_ID.test(id)) {
    throw new Error("youTubeEmbedSrc called with an invalid YouTube id");
  }
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${id}?rel=0&modestbranding=1`;
}

/** Thumbnail for the editor's lightweight preview, so the editor does not have
 *  to instantiate a player per video while the author is typing. */
export function youTubeThumbnail(id: string): string {
  if (!YOUTUBE_ID.test(id)) {
    throw new Error("youTubeThumbnail called with an invalid YouTube id");
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Canonical watch URL, for the caption link and the no-JS fallback. */
export function youTubeWatchUrl(id: string): string {
  if (!YOUTUBE_ID.test(id)) {
    throw new Error("youTubeWatchUrl called with an invalid YouTube id");
  }
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Whether a src is one this application produced.
 *
 * The sanitizer's last line of defence: an <iframe> in stored HTML only
 * survives if its src matches what youTubeEmbedSrc would have generated for
 * some valid id. Anything else -- another provider, a data: URL, a lookalike
 * host -- is dropped.
 */
export function isAllowedEmbedSrc(src: string | null | undefined): boolean {
  if (!src) return false;

  let url: URL;
  try {
    url = new URL(src, YOUTUBE_EMBED_ORIGIN);
  } catch {
    return false;
  }

  if (url.protocol !== "https:") return false;
  if (url.origin !== YOUTUBE_EMBED_ORIGIN) return false;

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length !== 2 || segments[0] !== "embed") return false;

  return YOUTUBE_ID.test(segments[1]);
}
