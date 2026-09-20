import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const dynamic = 'force-dynamic';

// Trust and utility pages that should be discoverable. Kept in one list so a
// new dedicated /page/* route only needs one entry here. Legacy short slugs
// (/page/editorial, /page/privacy, ...) are deliberately absent: they 308 to
// these, and redirects do not belong in a sitemap.
const STATIC_PAGES = [
  "about",
  "contact",
  "advertising",
  "careers",
  "media-kit",
  "newsletters",
  "editorial-standards",
  "editorial-policy",
  "corrections",
  "transparency",
  "privacy-policy",
  "terms-of-use",
  "cookie-policy",
  "disclaimer",
  "accessibility",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, authors, tags] = await Promise.all([
    db.article.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({
      select: { slug: true },
    }),
    db.author.findMany({
      select: { slug: true },
    }),
    db.tag.findMany({
      select: { slug: true },
    }),
  ]);

  const articleEntries: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${siteConfig.url}/article/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteConfig.url}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const authorEntries: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${siteConfig.url}/author/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${siteConfig.url}/tag/${t.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.4,
  }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((slug) => ({
    url: `${siteConfig.url}/page/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.3,
  }));

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/latest`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    ...articleEntries,
    ...categoryEntries,
    ...authorEntries,
    ...tagEntries,
    ...staticEntries,
  ];
}
