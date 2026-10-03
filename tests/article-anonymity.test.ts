import { beforeEach, describe, expect, it, vi } from "vitest";
import { article, auditLog, benchmarkLeaderboard } from "@/lib/db/schema";
import { upsertArticle } from "@/app/actions/article";

const mocks = vi.hoisted(() => ({
  user: vi.fn(), existing: vi.fn(), auth: vi.fn(), limit: vi.fn(), revalidateTag: vi.fn(),
  revalidatePath: vi.fn(), upload: vi.fn(),
  afterTasks: [] as (() => Promise<void>)[],
  writes: [] as { table: unknown; payload: Record<string, unknown> }[],
}));
vi.mock("@/lib/db", () => ({ db: {
  query: { user: { findFirst: mocks.user }, article: { findFirst: mocks.existing } },
  select: () => ({ from: () => ({ where: () => ({ limit: mocks.limit }) }) }),
  insert: (table: unknown) => ({ values: (payload: Record<string, unknown>) => {
    mocks.writes.push({ table, payload });
    return {
      returning: async (columns: Record<string, unknown>) => [Object.fromEntries(
        Object.keys(columns).map(key => [key, key === "id" ? "story" : payload[key]]),
      )],
      onConflictDoUpdate: async () => undefined,
    };
  } }),
  update: (table: unknown) => ({ set: (payload: Record<string, unknown>) => {
    mocks.writes.push({ table, payload });
    return { where: () => ({ returning: async (columns: Record<string, unknown>) => [Object.fromEntries(
      Object.keys(columns).map(key => [key, key === "id" ? "story" : payload[key]]),
    )] }) };
  } }),
  delete: () => ({ where: async () => undefined }),
} }));
vi.mock("@/lib/auth", () => ({ getCurrentUser: mocks.auth }));
vi.mock("@/lib/revalidate", () => ({ revalidatePath: mocks.revalidatePath, revalidateTag: mocks.revalidateTag }));
vi.mock("@/lib/storage", () => ({ uploadToR2: mocks.upload, deleteKeyFromR2: vi.fn() }));
vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => mocks.afterTasks.push(task) }));

async function runAfterResponse() {
  for (const task of mocks.afterTasks.splice(0)) await task();
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.writes.length = 0;
  mocks.afterTasks.length = 0;
  mocks.upload.mockResolvedValue("articles/content-story.json");
  mocks.auth.mockResolvedValue({ id: "editor", name: "Real Writer", role: "EDITOR", authorId: "real-author" });
  mocks.user.mockResolvedValue({ id: "editor", role: "EDITOR", authorProfile: { id: "real-author" } });
  mocks.existing.mockResolvedValue({ id: "story", authorId: "real-author", isAnonymous: true, status: "DRAFT", slug: "story", updatedAt: new Date() });
  mocks.limit.mockReset().mockResolvedValueOnce([{ id: "category-ai" }]).mockResolvedValue([]);
});

describe("saving editorial anonymity", () => {
  it.each([true, false, undefined])("persists %s on creation while retaining internal author ownership", async isAnonymous => {
    const result = await upsertArticle({ title: "Story", cat: "ai", isAnonymous });
    expect(result.success).toBe(true);
    const saved = mocks.writes.find(write => write.table === article)?.payload;
    expect(saved).toMatchObject({ isAnonymous: isAnonymous ?? false, authorId: "real-author", author: "Real Writer", categoryId: "category-ai" });
  });

  it.each([true, false, undefined])("handles %s on update and autosave without silently resetting anonymity", async isAnonymous => {
    const result = await upsertArticle({ id: "story", title: "Story", cat: "ai", isAnonymous, isAutosave: true });
    expect(result.success).toBe(true);
    expect(mocks.writes.find(write => write.table === article)?.payload.isAnonymous).toBe(isAnonymous ?? true);
    await runAfterResponse();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it.each(["false", 1, null])("rejects invalid anonymity value %s before writing", async isAnonymous => {
    expect(await upsertArticle({ title: "Story", cat: "ai", isAnonymous })).toMatchObject({ success: false });
    expect(mocks.writes).toHaveLength(0);
  });

  it("still requires permission to edit the article", async () => {
    mocks.auth.mockResolvedValue({ id: "writer", role: "AUTHOR", authorId: "different-author" });
    expect(await upsertArticle({ id: "story", title: "Story", cat: "ai", isAnonymous: false })).toMatchObject({ success: false });
    expect(mocks.writes).toHaveLength(0);
  });
});

describe("article save request cost", () => {
  it("reuses the verified actor for ownership and auditing without another user read", async () => {
    expect(await upsertArticle({ title: "Story", cat: "ai" })).toMatchObject({ success: true });
    expect(mocks.auth).toHaveBeenCalledTimes(1);
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.writes.find(write => write.table === auditLog)?.payload.userId).toBe("editor");
  });

  it("sanitizes and persists a 50KB body before responding without returning search text", async () => {
    const bodyHtml = `<p>${"Article text ".repeat(5000)}</p><script>alert('unsafe')</script>`;
    const bodyJson = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Article text" }] }] };
    const result = await upsertArticle({ title: "Story", cat: "ai", bodyHtml, bodyJson });
    expect(result.success).toBe(true);
    expect(mocks.upload).toHaveBeenCalledTimes(1);
    const content = JSON.parse(mocks.upload.mock.calls[0][1]);
    expect(content.html).not.toContain("<script>");
    expect(content.html).not.toContain("alert(");
    expect(content.json).toEqual(bodyJson);
    expect(mocks.writes.find(write => write.table === article)?.payload.textContent).toHaveLength(65002);
    expect(JSON.stringify(result).length).toBeLessThan(1000);
    expect(result).not.toHaveProperty("article.textContent");
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    await runAfterResponse();
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin/editor/story");
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith("/", "layout");
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
  });

  it.each([true, false])("defers published anonymity changes (%s) and expires cached bylines", async isAnonymous => {
    mocks.existing.mockResolvedValue({ id: "story", authorId: "real-author", isAnonymous: true, status: "PUBLISHED", slug: "story", updatedAt: new Date() });
    const result = await upsertArticle({ id: "story", title: "Story", cat: "ai", status: "PUBLISHED", isAnonymous });
    expect(result).toMatchObject({ success: true, article: { status: "PUBLISHED" } });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(mocks.revalidateTag).not.toHaveBeenCalled();
    await runAfterResponse();
    expect(mocks.revalidateTag).toHaveBeenCalledWith("articles", { expire: 0 });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("article:story", { expire: 0 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/feed.xml");
    expect(mocks.revalidatePath).not.toHaveBeenCalledWith("/", "layout");
  });

  it("does not query unchanged slugs or lose earlier redirects on autosave", async () => {
    mocks.existing.mockResolvedValue({ id: "story", authorId: "real-author", isAnonymous: false, status: "DRAFT", slug: "story", previousSlugs: ["old-story"], updatedAt: new Date() });
    expect(await upsertArticle({ id: "story", title: "Story", slug: "story", cat: "ai", isAutosave: true })).toMatchObject({ success: true });
    expect(mocks.limit).toHaveBeenCalledTimes(1);
    expect(mocks.writes.find(write => write.table === article)?.payload.previousSlugs).toEqual(["old-story"]);
  });

  it("runs benchmark synchronization only after the published save response", async () => {
    const bodyJson = { type: "doc", content: [{ type: "scoreBreakdownBlock", attrs: { items: [{ tab: "CPU", subCategory: "Single", metric: "Score", score: 200 }] } }] };
    expect(await upsertArticle({ title: "Story", cat: "ai", status: "PUBLISHED", bodyJson })).toMatchObject({ success: true });
    expect(mocks.writes.some(write => write.table === benchmarkLeaderboard)).toBe(false);
    await runAfterResponse();
    expect(mocks.writes.find(write => write.table === benchmarkLeaderboard)?.payload).toMatchObject({ topScore: 200, articleId: "story" });
    expect(mocks.revalidateTag).toHaveBeenCalledWith("benchmark-leaderboard", "max");
  });
});
