import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ARTICLE_CARD_WITH_TAGS_SELECT } from "@/lib/queries";
import StoryRow from "@/components/article/StoryRow";
import Sidebar from "@/components/layout/Sidebar";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tag = await db.tag.findUnique({ where: { slug } });
  
  if (!tag) {
    return { title: "Tag Not Found — xCipher" };
  }
  
  const count = await db.article.count({
    where: {
      status: "PUBLISHED",
      tags: { some: { id: tag.id } }
    }
  });

  return {
    title: `${tag.name} News & Articles — xCipher`,
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
  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const tag = await db.tag.findUnique({ where: { slug } });
  if (!tag) {
    notFound();
  }

  const [articles, totalCount] = await Promise.all([
    db.article.findMany({
      where: {
        status: "PUBLISHED",
        tags: { some: { id: tag.id } }
      },
      orderBy: { publishedAt: "desc" },
      skip,
      take: limit,
      select: ARTICLE_CARD_WITH_TAGS_SELECT,
    }),
    db.article.count({
      where: {
        status: "PUBLISHED",
        tags: { some: { id: tag.id } }
      }
    })
  ]);

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
              articles.map(a => <StoryRow key={a.id} article={a} />)
            ) : (
              <p className="muted" style={{ padding: "40px 0" }}>No published articles found with this tag.</p>
            )}
            
            {(hasPrevPage || hasNextPage) && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px", padding: "16px 0", borderTop: "1px solid var(--line)" }}>
                {hasPrevPage ? (
                  <Link href={`/tag/${tag.slug}?page=${page - 1}`} className="btn-cs">← Previous Page</Link>
                ) : <span />}
                {hasNextPage && (
                  <Link href={`/tag/${tag.slug}?page=${page + 1}`} className="btn-cs primary">Next Page →</Link>
                )}
              </div>
            )}
          </div>
        </div>
        <Sidebar />
      </div>
    </div>
  );
}
