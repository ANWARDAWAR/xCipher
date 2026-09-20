import { describe, it, expect } from "vitest";
import {
  readingMinutesFromHtml,
  listeningMinutesFromHtml,
  wordCountFromHtml,
  WORDS_PER_MINUTE_READ,
} from "@/lib/reading-time";

describe("reading-time", () => {
  it("returns 0 for empty content so callers render nothing", () => {
    expect(readingMinutesFromHtml(null)).toBe(0);
    expect(readingMinutesFromHtml(undefined)).toBe(0);
    expect(readingMinutesFromHtml("")).toBe(0);
    expect(readingMinutesFromHtml("<p></p>")).toBe(0);
  });

  it("strips markup and counts words", () => {
    // Punctuation directly against a closing tag counts as its own
    // token (tags become spaces); the estimate only needs +-1 accuracy.
    expect(wordCountFromHtml("<p>Hello <b>brave</b> new world of tech</p>")).toBe(6);
  });

  it("drops script and style contents entirely", () => {
    const html = "<p>one two</p><script>var nine = words + here;</script>";
    expect(wordCountFromHtml(html)).toBe(2);
  });

  it("computes minutes from the 200 wpm baseline, rounding up", () => {
    const words = Array(WORDS_PER_MINUTE_READ * 2 + 5).fill("word").join(" ");
    expect(readingMinutesFromHtml(`<p>${words}</p>`)).toBe(3);
  });

  it("a short article still reads as 1 minute, never 0", () => {
    expect(readingMinutesFromHtml("<p>Breaking: something happened.</p>")).toBe(1);
  });

  it("listening time uses the slower speech rate", () => {
    const words = Array(WORDS_PER_MINUTE_READ * 2).fill("word").join(" ");
    expect(listeningMinutesFromHtml(`<p>${words}</p>`)).toBeGreaterThan(
      readingMinutesFromHtml(`<p>${words}</p>`)
    );
  });

  it("entities do not corrupt word boundaries", () => {
    expect(wordCountFromHtml("<p>Tom&nbsp;Jerry &amp; friends</p>")).toBe(4);
  });

  it("never returns the old fabricated constant", () => {
    // The bug this module replaced: every article said "5 min read". Both a
    // tiny brief and a long feature must now differ from each other.
    const brief = readingMinutesFromHtml("<p>Short item.</p>");
    const long = readingMinutesFromHtml(`<p>${Array(1600).fill("word").join(" ")}</p>`);
    expect(brief).not.toBe(5);
    expect(long).toBeGreaterThan(brief);
  });
});
