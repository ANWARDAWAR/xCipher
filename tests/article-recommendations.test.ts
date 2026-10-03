import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), cache: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { query: { article: { findMany: mocks.findMany } } } }));
vi.mock("next/cache", () => ({ unstable_cache: mocks.cache }));

beforeEach(() => {
  vi.resetModules();
  mocks.findMany.mockReset().mockResolvedValue([]);
  mocks.cache.mockReset().mockImplementation(fn => fn);
});

describe("article recommendation caching", () => {
  it("caches tag matches, category fallback and discovery together for one hour", async () => {
    const { getArticleRecommendations } = await import("@/lib/cached-queries");
    mocks.findMany
      .mockResolvedValueOnce([{ id: "tag-match" }])
      .mockResolvedValueOnce([{ id: "category-match" }])
      .mockResolvedValueOnce([{ id: "discovery" }]);

    const result = await getArticleRecommendations("current", ["tag-1"], "category-1", "technology");
    expect(result).toEqual({ related: [{ id: "tag-match" }, { id: "category-match" }], discoverMore: [{ id: "discovery" }] });
    const registration = mocks.cache.mock.calls.find(([, keys]) => keys[0] === "article-recommendations");
    expect(registration?.[1]).toEqual(["article-recommendations", "technology"]);
    expect(registration?.[2]).toEqual({ tags: ["articles", "category:technology"], revalidate: 3600 });
    expect(mocks.findMany.mock.calls.map(([options]) => options.limit)).toEqual([3, 2, 4]);

    const queries = mocks.findMany.mock.calls.map(([options]) => new PgDialect().sqlToQuery(options.where as SQL));
    for (const query of queries) {
      expect(query.params).toContain("PUBLISHED");
      expect(query.sql).toContain('"Article"."publishedAt" <=');
      expect(query.params).toContain("current");
    }
    expect(queries[0].params).toContain("tag-1");
    expect(queries[1].params).toContain("tag-match");
    expect(queries[1].sql).toContain('"parentId" =');
    expect(queries[2].params).toEqual(expect.arrayContaining(["current", "tag-match", "category-match", "category-1"]));
    expect(queries[2].sql).toContain('"Article"."categoryId" NOT IN');
  });

  it("avoids invalid empty tag/category predicates for an uncategorized article", async () => {
    const { getArticleRecommendations } = await import("@/lib/cached-queries");
    await getArticleRecommendations("current", [], null, "news");
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
    for (const [options] of mocks.findMany.mock.calls) {
      const query = new PgDialect().sqlToQuery(options.where as SQL);
      expect(query.sql).not.toContain('FROM "_ArticleToTag"');
      expect(query.sql).not.toContain('FROM "Category"');
      expect(query.params).toContain("current");
    }
  });

  it("skips the fallback once tag matches fill the related section", async () => {
    const { getArticleRecommendations } = await import("@/lib/cached-queries");
    mocks.findMany.mockResolvedValueOnce([{ id: "one" }, { id: "two" }, { id: "three" }]);
    await getArticleRecommendations("current", ["tag"], "category", "technology");
    expect(mocks.findMany.mock.calls.map(([options]) => options.limit)).toEqual([3, 4]);
  });

  it("passes every query-dependent value as cache arguments with canonical tag order", async () => {
    const calls = vi.fn();
    mocks.cache.mockImplementation(fn => (...args: unknown[]) => {
      calls(...args);
      return fn(...args);
    });
    const { getArticleRecommendations } = await import("@/lib/cached-queries");
    await getArticleRecommendations("current", ["b", "a", "b"], "parent", "technology");
    expect(calls).toHaveBeenCalledWith("current", ["a", "b"], "parent");
  });

  it("retains the existing hourly leaderboard cache", async () => {
    await import("@/lib/cached-queries");
    const registration = mocks.cache.mock.calls.find(([, keys]) => keys[0] === "benchmark-leaderboard");
    expect(registration?.[2]).toEqual({ tags: ["benchmark-leaderboard"], revalidate: 3600 });
  });
});
