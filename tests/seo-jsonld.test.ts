import { describe, it, expect } from "vitest";
import { stringifyJsonLd } from "@/lib/seo";

describe("stringifyJsonLd", () => {
  it("round-trips through JSON.parse unchanged", () => {
    const data = {
      "@context": "https://schema.org",
      headline: "A normal headline",
      nested: { value: 42, flag: true },
    };
    expect(JSON.parse(stringifyJsonLd(data))).toEqual(data);
  });

  it("escapes < so a title cannot close the script tag early", () => {
    const payload = { headline: '</script><img src=x onerror="alert(1)">' };
    const out = stringifyJsonLd(payload);

    // The raw string contains no literal closing tag...
    expect(out).not.toContain("</script>");
    // ...it is escaped as unicode...
    expect(out).toContain("\\u003c/script>");
    // ...and it still parses back to the exact original payload.
    expect(JSON.parse(out)).toEqual(payload);
  });

  it("escapes less-than signs inside arbitrary nested content", () => {
    const out = stringifyJsonLd({ body: "a < b && c </ odd" });
    expect(out).not.toContain("<");
  });

  it("escapes lone line separators that are valid in JSON but not in JS", () => {
    const payload = { text: `line${String.fromCharCode(0x2028)}break${String.fromCharCode(0x2029)}here` };
    const out = stringifyJsonLd(payload);
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
    expect(JSON.parse(out)).toEqual(payload);
  });
});
