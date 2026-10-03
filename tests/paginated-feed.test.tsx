// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PaginatedFeed from "@/components/article/PaginatedFeed";
import type { FeedArticle } from "@/lib/feed";

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("@/app/actions/feed-actions", () => ({ getMoreArticles: mocks.load }));
vi.mock("@/components/article/StoryRow", () => ({
  default: ({ article }: { article: FeedArticle }) => React.createElement("article", { "data-id": article.id }, article.title),
}));

const article = (id: string) => ({
  id, slug: id, title: id, deck: null, img: null, author: null, role: null,
  views: 0, readingTime: 1, featured: false, status: "PUBLISHED",
  createdAt: new Date("2026-01-01"), publishedAt: new Date("2026-01-01"),
  homepagePlacement: null, categoryId: null, category: null, authorModel: null,
}) as FeedArticle;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  mocks.load.mockReset();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("PaginatedFeed", () => {
  it("renders initial rows, counts the featured offset, appends a partial page and ends pagination", async () => {
    mocks.load.mockResolvedValue([article("older")]);
    await act(() => root.render(<PaginatedFeed initialArticles={[article("initial")]} initialOffset={1} initialHasMore filter={{ categorySlug: "tech" }} />));
    expect(container.querySelectorAll("article")).toHaveLength(1);
    await act(async () => { container.querySelector("button")!.click(); });
    expect(mocks.load).toHaveBeenCalledWith(2, 20, { categorySlug: "tech" });
    expect(container.querySelectorAll("article")).toHaveLength(2);
    expect(container.querySelector("button")).toBeNull();
  });

  it("prevents double dispatch and retries a failed request at the same offset", async () => {
    let reject!: (error: Error) => void;
    mocks.load.mockReturnValueOnce(new Promise((_, fail) => { reject = fail; }));
    await act(() => root.render(<PaginatedFeed initialArticles={[article("initial")]} initialHasMore />));
    await act(() => {
      container.querySelector("button")!.click();
      container.querySelector("button")!.click();
    });
    expect(mocks.load).toHaveBeenCalledTimes(1);
    expect(container.querySelector("button")!.disabled).toBe(true);
    await act(async () => { reject(new Error("offline")); });
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Please try again");
    mocks.load.mockResolvedValue([]);
    await act(async () => { container.querySelector("button")!.click(); });
    expect(mocks.load).toHaveBeenLastCalledWith(1, 20, undefined);
    expect(container.querySelectorAll("article")).toHaveLength(1);
    expect(container.querySelector("button")).toBeNull();
  });

  it("deduplicates a shifted page while advancing by the number of rows consumed", async () => {
    mocks.load.mockResolvedValueOnce([article("initial"), ...Array.from({ length: 19 }, (_, i) => article(`new-${i}`))]);
    await act(() => root.render(<PaginatedFeed initialArticles={[article("initial")]} initialHasMore />));
    await act(async () => { container.querySelector("button")!.click(); });
    expect(container.querySelectorAll("article")).toHaveLength(20);
    mocks.load.mockResolvedValue([]);
    await act(async () => { container.querySelector("button")!.click(); });
    expect(mocks.load).toHaveBeenLastCalledWith(21, 20, undefined);
  });

  it("resets the list when navigation changes the filter", async () => {
    await act(() => root.render(<PaginatedFeed initialArticles={[article("old")]} initialHasMore filter={{ tagSlug: "old" }} />));
    await act(() => root.render(<PaginatedFeed initialArticles={[article("new")]} filter={{ tagSlug: "new" }} />));
    expect(container.querySelector("article")?.textContent).toBe("new");
    expect(container.querySelector("button")).toBeNull();
  });
});
