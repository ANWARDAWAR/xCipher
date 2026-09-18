import { describe, it, expect } from "vitest";
import { sanitizeArticleHtml, sanitizeBioHtml } from "@/lib/sanitize";

describe("highlight and alignment survive publication", () => {
  it("keeps <mark>", () => {
    expect(sanitizeArticleHtml("<p><mark>hi</mark></p>")).toContain("<mark>");
  });

  it.each(["left", "right", "center", "justify"])("keeps text-align: %s", (a) => {
    const out = sanitizeArticleHtml(`<p style="text-align: ${a}">x</p>`);
    expect(out).toContain(`text-align: ${a}`);
  });

  it("normalises casing and spacing", () => {
    const out = sanitizeArticleHtml(`<p style="TEXT-ALIGN:   CENTER">x</p>`);
    expect(out).toContain("text-align: center");
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
    expect(out).toContain("text-align: right");
    expect(out).not.toContain("position");
    expect(out).not.toContain("evil.test");
  });

  it("rejects a bogus alignment value", () => {
    const out = sanitizeArticleHtml(`<p style="text-align: expression(alert(1))">x</p>`);
    expect(out).not.toContain("style=");
  });

  it("still blocks script and handlers", () => {
    const out = sanitizeArticleHtml(`<p style="text-align:center" onclick="alert(1)">x</p><script>y()</script>`);
    expect(out).toContain("text-align: center");
    expect(out).not.toContain("onclick");
    expect(out).not.toContain("script");
  });
});

describe("bio sanitizer stays narrow", () => {
  it("gains neither mark nor style", () => {
    const out = sanitizeBioHtml(`<p style="text-align:center"><mark>x</mark></p>`);
    expect(out).not.toContain("style=");
    expect(out).not.toContain("mark");
    expect(out).toContain("x");
  });
});
