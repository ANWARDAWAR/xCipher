import { describe, it, expect } from "vitest";
import {
  parseYouTubeId,
  isYouTubeUrl,
  youTubeEmbedSrc,
  isAllowedEmbedSrc,
  YOUTUBE_EMBED_ORIGIN,
} from "@/lib/embeds";

// ─────────────────────────────────────────────────────────────────────────────
// Embed URL parsing
// ─────────────────────────────────────────────────────────────────────────────
//
// This module decides which iframes reach a published page, so the negative
// cases matter more than the positive ones. A parser that is merely permissive
// would let a crafted URL through the sanitizer, which is the one failure here
// with a security consequence rather than a cosmetic one.
// ─────────────────────────────────────────────────────────────────────────────

const ID = "dQw4w9WgXcQ"; // 11 chars, the real YouTube id shape

describe("parseYouTubeId — accepted shapes", () => {
  it.each([
    ["watch", `https://www.youtube.com/watch?v=${ID}`],
    ["watch, extra params", `https://www.youtube.com/watch?v=${ID}&t=42s&list=PLabc`],
    ["short host", `https://youtu.be/${ID}`],
    ["short host with query", `https://youtu.be/${ID}?t=90`],
    ["embed path", `https://www.youtube.com/embed/${ID}`],
    ["shorts", `https://www.youtube.com/shorts/${ID}`],
    ["live", `https://www.youtube.com/live/${ID}`],
    ["mobile", `https://m.youtube.com/watch?v=${ID}`],
    ["nocookie", `https://www.youtube-nocookie.com/embed/${ID}`],
    ["http", `http://www.youtube.com/watch?v=${ID}`],
    ["surrounding whitespace", `  https://youtu.be/${ID}  `],
    ["bare id", ID],
  ])("accepts %s", (_label, url) => {
    expect(parseYouTubeId(url)).toBe(ID);
  });
});

describe("parseYouTubeId — rejected", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty", ""],
    ["whitespace", "   "],
    ["not a url", "just some text"],
    ["a channel", "https://www.youtube.com/@sometechchannel"],
    ["a playlist", "https://www.youtube.com/playlist?list=PLabc"],
    ["bare youtube home", "https://www.youtube.com/"],
    ["watch with no v", "https://www.youtube.com/watch"],
    ["another provider", "https://vimeo.com/123456789"],
    // Lookalike hosts: the suffix matches but the registrable domain does not.
    ["lookalike host", `https://youtube.com.evil.test/watch?v=${ID}`],
    ["substring host", `https://notyoutube.com/watch?v=${ID}`],
    ["id too short", "https://youtu.be/abc"],
    ["id too long", `https://youtu.be/${ID}EXTRA`],
    ["id with bad chars", "https://youtu.be/abc$def!ghi"],
  ])("rejects %s", (_label, url) => {
    expect(parseYouTubeId(url as string | null | undefined)).toBeNull();
  });

  it("rejects javascript: even when the host looks right", () => {
    // new URL() parses this happily; only the protocol check stops it.
    expect(parseYouTubeId("javascript://www.youtube.com/watch?v=" + ID)).toBeNull();
  });

  it("rejects a data: URL", () => {
    expect(parseYouTubeId("data:text/html,<script>alert(1)</script>")).toBeNull();
  });
});

describe("isYouTubeUrl", () => {
  it("is true only for URLs that yield an id", () => {
    expect(isYouTubeUrl(`https://youtu.be/${ID}`)).toBe(true);
    expect(isYouTubeUrl("https://example.com/post")).toBe(false);
    // A plain article link must stay a hyperlink, never become an embed.
    expect(isYouTubeUrl("https://www.youtube.com/@channel")).toBe(false);
  });
});

describe("youTubeEmbedSrc", () => {
  it("builds a cookie-less embed URL from the id", () => {
    const src = youTubeEmbedSrc(ID);
    expect(src.startsWith(`${YOUTUBE_EMBED_ORIGIN}/embed/${ID}`)).toBe(true);
    expect(src).toContain("rel=0");
  });

  it("throws rather than emitting an unvalidated src", () => {
    // The guard exists so a bug upstream cannot turn into an injected attribute.
    expect(() => youTubeEmbedSrc("../../evil")).toThrow();
    expect(() => youTubeEmbedSrc("")).toThrow();
  });

  it("round-trips: every accepted URL produces an allowed src", () => {
    const id = parseYouTubeId(`https://www.youtube.com/watch?v=${ID}&t=1`);
    expect(id).not.toBeNull();
    expect(isAllowedEmbedSrc(youTubeEmbedSrc(id!))).toBe(true);
  });
});

describe("isAllowedEmbedSrc — the sanitizer's gate", () => {
  it("allows exactly what we generate", () => {
    expect(isAllowedEmbedSrc(youTubeEmbedSrc(ID))).toBe(true);
    expect(isAllowedEmbedSrc(`${YOUTUBE_EMBED_ORIGIN}/embed/${ID}`)).toBe(true);
  });

  it.each([
    ["null", null],
    ["empty", ""],
    ["plain youtube.com (not the embed origin)", `https://www.youtube.com/embed/${ID}`],
    ["http downgrade", `http://www.youtube-nocookie.com/embed/${ID}`],
    ["another provider", "https://player.vimeo.com/video/123"],
    ["arbitrary site", "https://evil.test/embed/anything"],
    ["origin lookalike", `https://www.youtube-nocookie.com.evil.test/embed/${ID}`],
    ["wrong path", `${YOUTUBE_EMBED_ORIGIN}/watch?v=${ID}`],
    ["path traversal", `${YOUTUBE_EMBED_ORIGIN}/embed/../../something`],
    ["no id", `${YOUTUBE_EMBED_ORIGIN}/embed/`],
    ["malformed id", `${YOUTUBE_EMBED_ORIGIN}/embed/short`],
    ["javascript", "javascript:alert(1)"],
    ["data url", "data:text/html,<script>alert(1)</script>"],
  ])("blocks %s", (_label, src) => {
    expect(isAllowedEmbedSrc(src as string | null | undefined)).toBe(false);
  });
});
