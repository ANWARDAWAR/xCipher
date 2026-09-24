import { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { siteConfig } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, categories, authors] = await Promise.all([
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
