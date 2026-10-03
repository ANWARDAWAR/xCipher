import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const mocks = vi.hoisted(() => ({ findMany: vi.fn(), cache: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { article: { findMany: mocks.findMany } } } }));
vi.mock('next/cache', () => ({ unstable_cache: mocks.cache }));

beforeEach(() => {
  vi.resetModules();
  mocks.findMany.mockReset().mockResolvedValue([]);
  mocks.cache.mockReset().mockImplementation(fn => fn);
});

describe('homepage data cache', () => {
  it('tags all homepage reads for publication invalidation with a five-minute TTL', async () => {
    await import('@/lib/cached-queries');
    for (const key of ['home-articles', 'home-hero', 'home-briefing']) {
      const registration = mocks.cache.mock.calls.find(([, keys]) => keys[0] === key);
      expect(registration?.[2]).toEqual({ tags: ['articles', 'homepage'], revalidate: 300 });
    }
  });

  it('excludes drafts and future publications from all homepage queries', async () => {
    const { getHomeArticles, getHomeHeroArticle, getHomeBriefing } = await import('@/lib/cached-queries');
    await getHomeArticles();
    expect(await getHomeHeroArticle()).toBeNull();
    await getHomeBriefing('hero-id');
    for (const [options] of mocks.findMany.mock.calls) {
      const query = new PgDialect().sqlToQuery(options.where as SQL);
      expect(query.sql).toContain('"Article"."status" =');
      expect(query.params).toContain('PUBLISHED');
      expect(query.sql).toContain('"Article"."publishedAt" <=');
      expect(query.sql).toContain('"Article"."publishedAt" is null');
    }
    const briefing = new PgDialect().sqlToQuery(mocks.findMany.mock.calls[2][0].where as SQL);
    expect(briefing.params).toContain('hero-id');
    expect(briefing.sql).toContain('"Article"."id" <>');
    expect(mocks.findMany.mock.calls[2][0].limit).toBe(4);
  });
});
