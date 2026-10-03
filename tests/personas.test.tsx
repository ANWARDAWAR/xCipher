// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { existsSync } from "node:fs";
import path from "node:path";
import { EDITORIAL_PERSONAS, getArticleAuthor, getPersonaForCategory, maskPublicArticle } from "@/lib/personas";
import { generateNewsArticleJsonLd, siteConfig } from "@/lib/seo";
import AuthorBox from "@/components/article/AuthorBox";
import StoryCard from "@/components/article/StoryCard";
import StoryRow from "@/components/article/StoryRow";
import EditorialPersonaSettings from "@/components/editorial/EditorialPersonaSettings";

vi.mock("@/components/author/AuthorProfileView", () => ({ SocialIcon: () => <svg data-social="true" /> }));
// eslint-disable-next-line @next/next/no-img-element -- Test the rendered identity independently of Next image optimization.
vi.mock("next/image", () => ({ default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} /> }));

const article = {
  id: "story", title: "A story", slug: "a-story", isAnonymous: true,
  createdAt: new Date("2026-01-01"), updatedAt: new Date("2026-01-02"),
  author: "Private Legacy Name", authorId: "private-author-id", role: "Private legacy role",
  category: { slug: "ai" },
  authorModel: {
    name: "Private Author", slug: "private-author", avatar: "/private-avatar.png",
    role: "Private role", bio: "Private biography", overview: "Private overview",
    socialLinks: [
      { platform: "Twitter", url: "https://x.com/private-author" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/private-author" },
      { platform: "Email", url: "mailto:private@example.com" },
    ],
  },
};

afterEach(() => vi.unstubAllGlobals());

describe("editorial personas", () => {
  it.each([
    ["ai", "xSypher AI Desk"], ["cybersecurity", "xSypher CyberOps"],
    ["software", "xSypher Dev Desk"], ["programming", "xSypher Dev Desk"],
    ["unknown", "xSypher Editorial"], [undefined, "xSypher Editorial"],
    ["constructor", "xSypher Editorial"],
  ])("resolves %s to %s", (slug, name) => {
    expect(getPersonaForCategory(slug).name).toBe(name);
  });

  it("inherits a subcategory's parent and uses real local logo assets", () => {
    expect(getPersonaForCategory("machine-learning", "ai").name).toBe("xSypher AI Desk");
    for (const persona of Object.values(EDITORIAL_PERSONAS)) {
      expect(existsSync(path.join(process.cwd(), "public", persona.avatar))).toBe(true);
    }
  });

  it("strips private identities before serialization without mutating stored data", () => {
    const masked = maskPublicArticle(article);
    expect(masked.author).toBe("xSypher AI Desk");
    expect(masked.authorId).toBeNull();
    expect(masked.authorModel).toBeNull();
    expect(JSON.stringify(masked)).not.toMatch(/private/i);
    expect(article.authorId).toBe("private-author-id");
    expect(getArticleAuthor({ ...article, isAnonymous: false }).name).toBe("Private Author");
  });

  it.each([AuthorBox, StoryCard, StoryRow])("masks real details and removes author links in %s", Component => {
    const html = renderToStaticMarkup(<Component article={article} />);
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.textContent).toContain("xSypher AI Desk");
    expect(html).not.toMatch(/private/i);
    expect(container.querySelector('a[href^="/author/"]')).toBeNull();
    expect(container.querySelector('[data-social]')).toBeNull();
    const avatar = container.querySelector('img[alt="xSypher AI Desk"]');
    expect(avatar?.getAttribute("src")).toBe("/icon.svg");
    expect(avatar?.closest("a")).toBeNull();
  });

  it("shows the persona bio and preserves named author profiles and all social links", () => {
    const anonymous = renderToStaticMarkup(<AuthorBox article={article} />);
    expect(anonymous).toContain(EDITORIAL_PERSONAS.ai.bio);
    const named = renderToStaticMarkup(<AuthorBox article={{ ...article, isAnonymous: false }} />);
    expect(named).toContain("Private biography");
    expect(named).toContain('href="/author/private-author"');
    expect(named).toContain('src="/private-avatar.png"');
    for (const social of article.authorModel.socialLinks) expect(named).toContain(`href="${social.url}"`);
    for (const Component of [StoryCard, StoryRow]) {
      expect(renderToStaticMarkup(<Component article={{ ...article, isAnonymous: false }} />)).toContain('href="/author/private-author"');
    }
  });

  it("emits an Organization for anonymous stories and a Person for named stories", () => {
    const schema = generateNewsArticleJsonLd(article);
    expect(schema.author).toEqual({ "@type": "Organization", name: "xSypher AI Desk", url: siteConfig.url });
    expect(JSON.stringify(schema)).not.toMatch(/private/i);
    expect(generateNewsArticleJsonLd({ ...article, isAnonymous: false }).author).toEqual([
      { "@type": "Person", name: "Private Author", url: `${siteConfig.url}/author/private-author` },
    ]);
    expect(generateNewsArticleJsonLd({ ...article, category: null }).author).toMatchObject({ name: "xSypher Editorial" });
  });

  it("updates the editor byline immediately when the category or toggle changes", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const container = document.createElement("div");
    const root = createRoot(container);
    const onChange = vi.fn();
    const props = { isAnonymous: true, categorySlug: "ai", authorName: "Private Author", onChange };
    try {
      await act(() => root.render(<EditorialPersonaSettings {...props} />));
      expect(container.textContent).toContain("xSypher AI Desk");
      await act(() => root.render(<EditorialPersonaSettings {...props} categorySlug="cybersecurity" />));
      expect(container.textContent).toContain("xSypher CyberOps");
      expect(container.textContent).not.toContain("xSypher AI Desk");
      await act(() => root.render(<EditorialPersonaSettings {...props} categorySlug="frameworks" parentSlug="software" />));
      expect(container.textContent).toContain("xSypher Dev Desk");
      await act(() => container.querySelector<HTMLInputElement>('[role="switch"]')!.click());
      expect(onChange).toHaveBeenCalledWith(false);
      await act(() => root.render(<EditorialPersonaSettings {...props} isAnonymous={false} />));
      expect(container.textContent).toContain("Public byline: Private Author");
      expect(container.textContent).not.toContain("xSypher AI Desk");
    } finally {
      await act(() => root.unmount());
    }
  });
});
