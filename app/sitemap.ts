import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';
import { eq } from 'drizzle-orm';
import { article as articleTable } from '@/lib/db/schema';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: any[] = [];
  let categories: any[] = [];
  let authors: any[] = [];

  try {
    const res = await Promise.all([
      db.query.article.findMany({
        where: eq(articleTable.status, 'PUBLISHED'),
        columns: { slug: true, updatedAt: true },
      }),
      db.query.category.findMany({
        columns: { slug: true },
      }),
      db.query.author.findMany({
        columns: { slug: true },
      }),
    ]);
    articles = res[0];
    categories = res[1];
    authors = res[2];
  } catch (error) {
    console.warn('[sitemap] Failed to fetch dynamic entries from DB:', error);
  }

  const articleEntries: MetadataRoute.Sitemap = articles.map((a: any) => ({
    url: `${siteConfig.url}/article/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c: any) => ({
    url: `${siteConfig.url}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const authorEntries: MetadataRoute.Sitemap = authors.map((a: any) => ({
    url: `${siteConfig.url}/author/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${siteConfig.url}/page/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/page/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/page/newsletters`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${siteConfig.url}/series`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  return [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    ...staticPages,
    ...articleEntries,
    ...categoryEntries,
    ...authorEntries,
  ];
}
