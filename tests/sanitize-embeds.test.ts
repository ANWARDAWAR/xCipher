import { describe, it, expect } from "vitest";
import { sanitizeArticleHtml, sanitizeBioHtml } from "@/lib/sanitize";
import { youTubeEmbedSrc } from "@/lib/embeds";

const ID = "dQw4w9WgXcQ";

describe("sanitizeArticleHtml — video embeds", () => {
  it("keeps an iframe we generated", () => {
    const html = `<div data-youtube-video><iframe src="${youTubeEmbedSrc(ID)}"></iframe></div>`;
    const out = sanitizeArticleHtml(html);
    expect(out).toContain("<iframe");
    expect(out).toContain(ID);
  });

  it("sets its own permissions rather than trusting the document", () => {
    const html = `<iframe src="${youTubeEmbedSrc(ID)}" sandbox="allow-scripts allow-same-origin" srcdoc="<script>alert(1)</script>" allow="camera; microphone"></iframe>`;
    const out = sanitizeArticleHtml(html);
    expect(out).not.toContain("srcdoc");
    expect(out).not.toContain("sandbox");
    expect(out).not.toContain("camera");
    expect(out).toContain("allowfullscreen");
    expect(out).toContain('loading="lazy"');
  });

  it.each([
    ["another provider", "https://player.vimeo.com/video/123"],
    ["arbitrary host", "https://evil.test/embed/x"],
    ["origin lookalike", "https://www.youtube-nocookie.com.evil.test/embed/" + ID],
    ["plain youtube.com", "https://www.youtube.com/embed/" + ID],
    ["javascript", "javascript:alert(1)"],
    ["data url", "data:text/html,<script>alert(1)</script>"],
    ["no src", ""],
  ])("drops an iframe pointing at %s", (_l, src) => {
    const out = sanitizeArticleHtml(`<p>before</p><iframe src="${src}"></iframe><p>after</p>`);
    expect(out).not.toContain("<iframe");
    // Surrounding copy is untouched -- the iframe is removed, not the article.
    expect(out).toContain("before");
    expect(out).toContain("after");
  });

  it("still strips script and event handlers", () => {
    const out = sanitizeArticleHtml(`<p onclick="alert(1)">hi</p><script>alert(2)</script>`);
    expect(out).not.toContain("script");
    expect(out).not.toContain("onclick");
    expect(out).toContain("hi");
  });

  it("leaves ordinary article markup intact", () => {
    const html = `<h2>Head</h2><p>Text <a href="https://example.com">link</a> <code>x</code></p><pre><code>y</code></pre><figure><img src="https://images.pexels.com/a.jpg" alt="a"><figcaption>cap</figcaption></figure>`;
    const out = sanitizeArticleHtml(html);
    for (const frag of ["<h2>", "<a ", "<code>", "<pre>", "<figure>", "<figcaption>", "<img"]) {
      expect(out).toContain(frag);
    }
  });
});

describe("sanitizeBioHtml — must stay narrow", () => {
  it("does not gain iframes from the article config", () => {
    const out = sanitizeBioHtml(`<p>bio</p><iframe src="${youTubeEmbedSrc(ID)}"></iframe>`);
    expect(out).not.toContain("iframe");
    expect(out).toContain("bio");
  });

  it("still allows only basic marks", () => {
    const out = sanitizeBioHtml(`<p><b>b</b><h1>no</h1></p>`);
    expect(out).toContain("<b>");
    expect(out).not.toContain("<h1>");
  });
});
