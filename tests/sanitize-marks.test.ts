import { describe, it, expect } from "vitest";
import { sanitizeArticleHtml, sanitizeBioHtml } from "@/lib/sanitize";

describe("highlight and alignment survive publication", () => {
  it("keeps <mark>", () => {
    expect(sanitizeArticleHtml("<p><mark>hi</mark></p>")).toContain("<mark>");
  });

  it.each(["left", "right", "center", "justify"])("keeps text-align: %s", (a) => {
    const out = sanitizeArticleHtml(`<p style="text-align: ${a}">x</p>`);
    expect(out).toContain(`text-align:${a}`);
  });

  it("normalises casing and spacing", () => {
    const out = sanitizeArticleHtml(`<p style="TEXT-ALIGN:   CENTER">x</p>`);
    expect(out).toContain("text-align:center");
  });
});

describe("style is not a general-purpose opening", () => {
  it.each([
    ["positioning", 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh'],
    ["background url", 'background: url(https://evil.test/track.png)'],
    ["behavior", 'behavior: url(#default#time2)'],
    ["opacity trick", 'opacity: 0'],
    ["custom property", '--x: red'],
  ])("drops %s", (_l, css) => {
    const out = sanitizeArticleHtml(`<p style="${css}">x</p>`);
    expect(out).not.toContain("style=");
    expect(out).toContain("x");
  });

  it("keeps only the alignment when mixed with other declarations", () => {
    const out = sanitizeArticleHtml(
      `<p style="position: fixed; text-align: right; background: url(https://evil.test/a.png)">x</p>`
    );
    expect(out).toContain("text-align:right");
    expect(out).not.toContain("position");
    expect(out).not.toContain("evil.test");
  });

  it("rejects a bogus alignment value", () => {
    const out = sanitizeArticleHtml(`<p style="text-align: expression(alert(1))">x</p>`);
    expect(out).not.toContain("style=");
  });

  it("still blocks script and handlers", () => {
    const out = sanitizeArticleHtml(`<p style="text-align:center" onclick="alert(1)">x</p><script>y()</script>`);
    expect(out).toContain("text-align:center");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("script");
  });
});

describe("bio sanitizer now matches the shared editor", () => {
  // The biography uses the article editor, so it must accept what that editor
  // produces -- otherwise the toolbar offers formatting that is deleted on save.
  it("keeps the marks and blocks the editor can produce", () => {
    const out = sanitizeBioHtml(
      `<h2>About</h2><p style="text-align:center"><mark>x</mark></p><ul><li>a</li></ul>`
    );
    expect(out).toContain("<h2>");
    expect(out).toContain("<mark>");
    expect(out).toContain("text-align:center");
    expect(out).toContain("<li>");
  });

  it("applies the same alignment-only restriction to style", () => {
    const out = sanitizeBioHtml(`<p style="position:fixed;background:url(https://evil.test/a.png)">x</p>`);
    expect(out).not.toContain("style=");
    expect(out).not.toContain("evil.test");
  });

  // Still deliberately narrower than an article.
  it("refuses an iframe", () => {
    const out = sanitizeBioHtml(
      `<p>bio</p><iframe src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"></iframe>`
    );
    expect(out).not.toContain("iframe");
    expect(out).toContain("bio");
  });

  it("refuses h1, which the page supplies itself", () => {
    const out = sanitizeBioHtml(`<h1>Name</h1><p>bio</p>`);
    expect(out).not.toContain("<h1>");
    expect(out).toContain("bio");
  });

  it("still blocks script and handlers", () => {
    const out = sanitizeBioHtml(`<p onclick="alert(1)">x</p><script>y()</script>`);
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("script");
  });
});
