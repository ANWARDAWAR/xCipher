import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { tag as tagTable, article as articleTable } from "@/lib/db/schema";
import { publicFeedWhere, queryPublicFeed } from "@/lib/feed";
import PaginatedFeed from "@/components/article/PaginatedFeed";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [tag] = await db.query.tag.findMany({ where: eq(tagTable.slug, slug), limit: 1 });
  
  if (!tag) {
    return { title: "Tag Not Found — xSypher" };
  }
  
  const [countResult] = await db.select({ count: sql`count(*)`.mapWith(Number) })
    .from(articleTable)
    .where(publicFeedWhere({ tagSlug: slug }));
  const count = countResult?.count || 0;

  return {
    title: `${tag.name} News & Articles — xSypher`,
    description: tag.description || `Read the latest news and analysis about ${tag.name}.`,
    alternates: {
      canonical: `/tag/${tag.slug}`,
    },
    robots: {
      index: count >= 3,
      follow: true,
    }
  };
}

export const dynamic = "force-dynamic";

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const requestedPage = typeof sp.page === "string" ? Number(sp.page) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 107374179 ? requestedPage : 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const [tag] = await db.query.tag.findMany({ where: eq(tagTable.slug, slug), limit: 1 });
  if (!tag) {
    notFound();
  }

  const filter = { tagSlug: slug };
  const whereClause = publicFeedWhere(filter);

  const [articles, countResult] = await Promise.all([
    queryPublicFeed(skip, limit, filter),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(articleTable).where(whereClause)
  ]);
  const totalCount = countResult[0]?.count || 0;

  const hasNextPage = skip + limit < totalCount;
  const hasPrevPage = page > 1;

  return (
    <div className="wrap">
      <section className="cat-hero">
        <span className="kicker">Tag</span>
        <h1>{tag.name}</h1>
        <p>{tag.description || `Explore ${totalCount} stories tagged with ${tag.name}.`}</p>
      </section>
      
      <div className="cat-body">
        <div>
          <div className="day-group">
            <div className="day-label" style={{ marginBottom: "16px" }}>Latest Stories</div>
            {articles.length > 0 ? (
              <PaginatedFeed initialArticles={articles} filter={filter} initialOffset={skip} initialHasMore={hasNextPage} />
            ) : (
              <p className="muted" style={{ padding: "40px 0" }}>No published articles found with this tag.</p>
            )}
            
            {hasPrevPage && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "16px 0", borderTop: "1px solid var(--line)" }}>
                <Link href={`/tag/${tag.slug}?page=${page - 1}`} className="btn-cs">← Previous Page</Link>
              </div>
            )}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
