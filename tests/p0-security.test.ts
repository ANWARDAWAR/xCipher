import { afterEach, describe, expect, it, vi } from 'vitest';
import { ilike } from 'drizzle-orm';
import { PgDialect, pgTable, text } from 'drizzle-orm/pg-core';
import { escapeLikePattern } from '@/lib/search-pattern';
import { hasRemoteMatch } from 'next/dist/shared/lib/match-remote-pattern';

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { query: { article: { findMany } } } }));
vi.mock('@/lib/seo', () => ({ siteConfig: { url: 'https://xsypher.com' } }));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe('public search patterns', () => {
  it.each([
    ['ordinary search', 'ordinary search'],
    ['100%_match', '100\\%\\_match'],
    ['\\%_', '\\\\\\%\\_'],
    ["reader's guide", "reader's guide"],
  ])('escapes literal metacharacters in %s', (input, expected) => {
    expect(escapeLikePattern(input)).toBe(expected);
  });

  it('keeps escaped user input in a bound Drizzle parameter', () => {
    const table = pgTable('test_articles', { title: text('title') });
    const pattern = `%${escapeLikePattern("%' OR 1=1 --_")}%`;
    const query = new PgDialect().sqlToQuery(ilike(table.title, pattern));
    expect(query.sql).toBe('"test_articles"."title" ilike $1');
    expect(query.params).toEqual(["%\\%' OR 1=1 --\\_%"]);
  });
});

describe('image proxy configuration', () => {
  it('allows configured image hosts and rejects arbitrary hosts and HTTP', async () => {
    vi.stubEnv('NEXT_PUBLIC_R2_PUBLIC_BASE', 'https://media.xsypher.com');
    const { default: config } = await import('../next.config');
    const patterns = config.images?.remotePatterns || [];
    for (const url of ['https://res.cloudinary.com/account/photo.jpg', 'https://images.unsplash.com/photo.jpg?w=800', 'https://media.xsypher.com/article.jpg']) {
      expect(hasRemoteMatch([], patterns, new URL(url))).toBe(true);
    }
    for (const url of ['https://attacker.example/photo.jpg', 'https://images.unsplash.com.attacker.example/photo.jpg', 'http://images.unsplash.com/photo.jpg', 'https://images.unsplash.com:8443/photo.jpg']) {
      expect(hasRemoteMatch([], patterns, new URL(url))).toBe(false);
    }
    expect(config.typescript?.ignoreBuildErrors).not.toBe(true);
  });

  it.each(['https://**.example.com', 'http://media.xsypher.com', 'not-a-url'])(
    'rejects unsafe R2 configuration: %s', async base => {
      vi.stubEnv('NEXT_PUBLIC_R2_PUBLIC_BASE', base);
      const { default: config } = await import('../next.config');
      expect(hasRemoteMatch([], config.images?.remotePatterns || [], new URL('https://attacker.example.com/photo.jpg'))).toBe(false);
    },
  );
});

describe('RSS article URLs', () => {
  it('uses the public article route for both links and permalink GUIDs', async () => {
    findMany.mockResolvedValue([{
      slug: 'phone-review', title: 'Phone & review', deck: 'Details',
      publishedAt: new Date('2026-10-01T00:00:00Z'), createdAt: new Date('2026-10-01T00:00:00Z'),
      authorModel: { name: 'Editor' },
    }]);
    const { GET } = await import('@/app/feed.xml/route');
    const response = await GET();
    const xml = await response.text();
    expect(response.status).toBe(200);
    expect(xml).toContain('<link>https://xsypher.com/article/phone-review</link>');
    expect(xml).toContain('<guid isPermaLink="true">https://xsypher.com/article/phone-review</guid>');
    expect(xml).toContain('<title>Phone &amp; review</title>');
  });
});
