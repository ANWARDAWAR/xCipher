import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getMoreArticles } from "@/app/actions/feed-actions";
import { publicFeedWhere } from "@/lib/feed";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { query: { article: { findMany: mocks.findMany } } } }));

beforeEach(() => mocks.findMany.mockReset().mockResolvedValue([]));
const dialect = new PgDialect();

describe("public feed pagination", () => {
  it("limits projection, enforces publication visibility and consistently sorts timestamp ties", async () => {
    await getMoreArticles(40, 20);
    const [options] = mocks.findMany.mock.calls[0];
    expect(options.offset).toBe(40);
    expect(options.limit).toBe(20);
    expect(options.columns).not.toHaveProperty("contentUrl");
    const query = dialect.sqlToQuery(options.where);
    expect(query.sql).toContain('"Article"."status" =');
    expect(query.params).toContain("PUBLISHED");
    expect(query.sql).toContain('"Article"."publishedAt" <=');
    expect(query.sql).toContain('"Article"."publishedAt" is null');
    expect(options.orderBy.map((order: Parameters<typeof dialect.sqlToQuery>[0]) => dialect.sqlToQuery(order).sql))
      .toEqual(['"Article"."publishedAt" desc', '"Article"."id" desc']);
  });

  it.each([[-1, 20], [0.5, 20], [0, 0], [0, 61], [NaN, 20], [Infinity, 20]])(
    "rejects invalid offset %s or limit %s before querying", async (offset, limit) => {
      await expect(getMoreArticles(offset, limit)).rejects.toThrow("Invalid feed request");
      expect(mocks.findMany).not.toHaveBeenCalled();
    },
  );

  it("rejects malformed filters and orphan subcategory filters", async () => {
    await expect(getMoreArticles(0, 20, { authorId: "" })).rejects.toThrow("Invalid feed request");
    await expect(getMoreArticles(0, 20, { subcategorySlug: "phones" })).rejects.toThrow("Invalid feed request");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("includes child categories by default but scopes a selected child to its parent", () => {
    const parent = dialect.sqlToQuery(publicFeedWhere({ categorySlug: "tech" })!);
    expect(parent.sql).toContain('OR "parentId" IN');
    const child = dialect.sqlToQuery(publicFeedWhere({ categorySlug: "tech", subcategorySlug: "phones" })!);
    expect(child.sql).toContain('AND "parentId" IN');
    expect(child.params).toEqual(expect.arrayContaining(["tech", "phones"]));
  });

  it("binds tag and author filters as SQL parameters and retains legacy bylines", async () => {
    const tagSlug = "tag' OR true --";
    await getMoreArticles(20, 20, { tagSlug, authorId: "author-1" });
    const query = dialect.sqlToQuery(mocks.findMany.mock.calls[0][0].where);
    expect(query.sql).toContain('FROM "_ArticleToTag"');
    expect(query.sql).toContain('"Article"."authorId" =');
    expect(query.sql).toContain('SELECT name FROM "Author"');
    expect(query.sql).not.toContain(tagSlug);
    expect(query.params).toEqual(expect.arrayContaining([tagSlug, "author-1"]));
  });

  it("propagates a retryable failure without exposing database errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findMany.mockRejectedValueOnce(new Error("private database URL"));
    await expect(getMoreArticles(0, 20)).rejects.toThrow("Could not load more articles. Please try again.");
    log.mockRestore();
  });
});
