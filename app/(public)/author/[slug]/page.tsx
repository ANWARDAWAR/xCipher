import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eq, sum } from "drizzle-orm";
import { author as authorTable, article as articleTable } from "@/lib/db/schema";
import { LISTING_ARTICLE_LIMIT } from "@/lib/queries";
import { getAuthorArticles } from "@/lib/cached-queries";
import { publicFeedWhere } from "@/lib/feed";
import PaginatedFeed from "@/components/article/PaginatedFeed";
import { siteConfig } from "@/lib/seo";
import { generatePersonJsonLd, parseAuthorSocialLinks } from "@/lib/entity-schema";
import { serializeJsonLd } from "@/lib/article-schema";
import AuthorProfileView from "@/components/author/AuthorProfileView";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [author] = await db.query.author.findMany({ 
    where: eq(authorTable.slug, slug), 
    with: { user: true },
    limit: 1
  });
  if (!author) return { title: `Author — ${siteConfig.name}` };
  
  const authorName = author.name || "Author";
  
  return {
    title: `${authorName} — ${siteConfig.name}`,
    description: author.overview || author.bio?.slice(0, 160) || `${authorName} on ${siteConfig.name}.`,
    alternates: {
      canonical: `/author/${slug}`,
    },
    openGraph: {
      title: `${authorName} — ${siteConfig.name}`,
      description: author.overview || author.bio?.slice(0, 160) || "",
      images: author.avatar ? [author.avatar] : [],
    },
  };
}

// Cached and revalidated on a timer, rather than force-dynamic.
//
// force-dynamic meant every visitor triggered a fresh render and a fresh set of
// queries, and -- more importantly -- it made every revalidatePath() call in the
// workflow actions a no-op, because there was never a cached entry to
// invalidate. Publishing already calls revalidatePath for this route, so an
// editorial change still appears immediately; the window below is only the
// ceiling for anything that changes without an explicit revalidation, such as
// a view count.
export const revalidate = 600; // author profile

export default async function AuthorProfile({ params }: Props) {
  const { slug } = await params;

  const [author] = await db.query.author.findMany({ 
    where: eq(authorTable.slug, slug), 
    with: { user: true },
    limit: 1
  });
  if (!author) notFound();

  const socials = parseAuthorSocialLinks(author.socialLinks);

  // Fetch articles
  // The list is capped, so the view total cannot be summed from it -- that
  // would silently under-report as soon as an author passes the cap. Postgres
  // does the sum over every row instead, which is one cheap indexed aggregate.
  const authorArticleWhere = publicFeedWhere({ authorId: author.id });

  const [articles, viewsAggregate] = await Promise.all([
    getAuthorArticles(author.id, slug),
    db.select({ totalViews: sum(articleTable.views) }).from(articleTable).where(authorArticleWhere),
  ]);

  const totalViews = Number(viewsAggregate?.[0]?.totalViews) || 0;

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(generatePersonJsonLd(author)) }}
    />
    <AuthorProfileView 
      author={author} 
      articles={articles} 
      socials={socials} 
      totalViews={totalViews} 
      articleFeed={
        <PaginatedFeed
          initialArticles={articles.slice(1)}
          initialOffset={articles.length ? 1 : 0}
          initialHasMore={articles.length === LISTING_ARTICLE_LIMIT}
          filter={{ authorId: author.id }}
        />
      }
    />
    </>
  );
}
