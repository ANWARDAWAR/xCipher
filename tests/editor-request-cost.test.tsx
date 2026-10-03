import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import EditDraftPage from "@/app/admin/(authenticated)/editor/[id]/page";
import NewStoryPage from "@/app/admin/(authenticated)/editor/page";
import ArticleEditor from "@/components/editorial/ArticleEditorClient";

const mocks = vi.hoisted(() => ({
  actor: vi.fn(), article: vi.fn(), author: vi.fn(), authors: vi.fn(), content: vi.fn(),
  redirect: vi.fn(), notFound: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.actor }));
vi.mock("@/lib/db", () => ({ db: { query: {
  article: { findFirst: mocks.article },
  author: { findFirst: mocks.author, findMany: mocks.authors },
} } }));
vi.mock("@/lib/storage", () => ({ fetchFromR2: mocks.content }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock("@/components/editorial/ArticleEditorClient", () => ({ default: () => null }));
vi.mock("@/components/editorial/ReviewFeedbackPanel", () => ({ default: () => null }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("React", React);
  mocks.actor.mockResolvedValue({ id: "writer", role: "EDITOR", authorId: "author-1", name: "Writer" });
  mocks.article.mockResolvedValue({
    id: "story", slug: "story", status: "DRAFT", authorId: "author-1",
    category: { slug: "ai" }, contentUrl: "articles/story.json",
    tags: [], reviews: [], revisions: [{ id: "revision-1", notes: "Saved", createdAt: new Date() }],
  });
  mocks.author.mockResolvedValue({ id: "author-1", name: "Writer", role: "Reporter" });
  mocks.authors.mockResolvedValue([]);
  mocks.content.mockResolvedValue({ html: `<p>${"Article ".repeat(7000)}</p>`, json: { type: "doc" } });
  mocks.redirect.mockImplementation((path: string) => { throw new Error(`redirect:${path}`); });
  mocks.notFound.mockImplementation(() => { throw new Error("not-found"); });
});
afterEach(() => vi.unstubAllGlobals());

describe("editor request data", () => {
  it("sends one HTML copy, excludes search text and keeps revision data out of initialData", async () => {
    const element = await EditDraftPage({ params: Promise.resolve({ id: "story" }) });
    const children = React.Children.toArray(element.props.children);
    const editor = children.find(child => React.isValidElement(child) && child.type === ArticleEditor);
    expect(React.isValidElement(editor)).toBe(true);
    if (!React.isValidElement<{ initialData: Record<string, unknown>; initialRevisions: unknown[] }>(editor)) throw new Error("Missing editor");
    expect(editor.props.initialData.bodyHtml).toBe(`<p>${"Article ".repeat(7000)}</p>`);
    expect(editor.props.initialData).not.toHaveProperty("body");
    expect(editor.props.initialData).not.toHaveProperty("textContent");
    expect(editor.props.initialData).not.toHaveProperty("revisions");
    expect(editor.props.initialData).not.toHaveProperty("reviews");
    expect(editor.props.initialRevisions).toHaveLength(1);
    const options = mocks.article.mock.calls[0][0];
    expect(options.columns).toEqual({ textContent: false });
    expect(options.with.revisions.columns).not.toHaveProperty("contentUrl");
    expect(mocks.author.mock.calls[0][0].columns).toEqual({ id: true, name: true, role: true });
    const query = new PgDialect().sqlToQuery(options.where as SQL);
    expect(query.params).toContain("author-1");
    expect(query.params).toContain("story");
    expect(mocks.content).toHaveBeenCalledWith("articles/story.json");
  });

  it("redirects unauthenticated requests before fetching article metadata or bodies", async () => {
    mocks.actor.mockResolvedValue(null);
    await expect(EditDraftPage({ params: Promise.resolve({ id: "story" }) })).rejects.toThrow("redirect:/admin/login");
    expect(mocks.article).not.toHaveBeenCalled();
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it("does not fetch R2 content for an article the actor cannot edit", async () => {
    mocks.article.mockResolvedValue({ id: "story", authorId: "other-author" });
    await expect(EditDraftPage({ params: Promise.resolve({ id: "story" }) })).rejects.toThrow("redirect:/admin/drafts");
    expect(mocks.content).not.toHaveBeenCalled();
    expect(mocks.author).not.toHaveBeenCalled();
  });

  it("loads only the author fields needed for the new-story editor", async () => {
    const element = await NewStoryPage();
    const children = React.Children.toArray(element.props.children);
    const editor = children.find(child => React.isValidElement(child) && child.type === ArticleEditor);
    if (!React.isValidElement<{ authorName: string; authorId: string; availableAuthors: unknown[] }>(editor)) throw new Error("Missing editor");
    expect(editor.props.authorName).toBe("Writer");
    expect(editor.props.authorId).toBe("author-1");
    expect(editor.props.availableAuthors).toEqual([]);
    expect(editor.props).not.toHaveProperty("availableCategories");
    expect(editor.props).not.toHaveProperty("availableTags");
    expect(mocks.author.mock.calls[0][0].columns).toEqual({ id: true, name: true, role: true });
    expect(mocks.article).not.toHaveBeenCalled();
    expect(mocks.content).not.toHaveBeenCalled();
  });

  it.each([null, "MODERATOR", "REVIEWER", "STAFF"])("guards the new-story editor for %s before fetching author data", async role => {
    mocks.actor.mockResolvedValue(role ? { id: "user", role, authorId: "author-1" } : null);
    await expect(NewStoryPage()).rejects.toThrow("redirect:/admin");
    expect(mocks.author).not.toHaveBeenCalled();
    expect(mocks.authors).not.toHaveBeenCalled();
  });
});
