import { describe, it, expect } from "vitest";
import { sanitizeArticleHtml } from "@/lib/sanitize";
import { youTubeEmbedSrc, parseYouTubeId } from "@/lib/embeds";

// Simulates the full path: what the editor's renderHTML emits -> what the
// server stores after sanitising -> what the public page injects.
describe("editor -> sanitizer -> public page", () => {
  it("a video inserted in the editor survives to the reader", () => {
    const id = parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30")!;
    // Exactly the shape YouTubeEmbed.renderHTML produces.
    const fromEditor =
      `<div data-youtube-video="" data-youtube-id="${id}" class="yt-embed">` +
      `<iframe src="${youTubeEmbedSrc(id)}" title="YouTube video player" loading="lazy" ` +
      `frameborder="0" allowfullscreen="" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>` +
      `</div>`;

    const stored = sanitizeArticleHtml(fromEditor);

    expect(stored).toContain("<iframe");
    expect(stored).toContain(`/embed/${id}`);
    expect(stored).toContain("youtube-nocookie.com");
    expect(stored).toContain("allowfullscreen");
    // Wrapper retained so the public stylesheet can size the block.
    expect(stored).toContain("data-youtube-video");
  });

  it("sanitising twice is stable (articles are re-sanitised on revision restore)", () => {
    const id = "dQw4w9WgXcQ";
    const once = sanitizeArticleHtml(`<div data-youtube-video><iframe src="${youTubeEmbedSrc(id)}"></iframe></div>`);
    const twice = sanitizeArticleHtml(once);
    expect(twice).toBe(once);
  });

  it("legacy articles with no embeds are untouched", () => {
    const legacy = `<h2>Heading</h2><p>Body <strong>bold</strong> <a href="https://example.com">link</a></p><ul><li>one</li></ul>`;
    const out = sanitizeArticleHtml(legacy);
    expect(out).toContain("<h2>");
    expect(out).toContain("<strong>");
    expect(out).toContain("<li>");
  });
});
