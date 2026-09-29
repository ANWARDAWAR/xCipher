export const runtime = 'edge';
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { eq, sum, and, or } from "drizzle-orm";
import { author as authorTable, article as articleTable } from "@/lib/db/schema";
import { ARTICLE_CARD_COLUMNS, ARTICLE_CARD_WITH, LISTING_ARTICLE_LIMIT } from "@/lib/queries";
import { siteConfig } from "@/lib/seo";
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

  // Parse social links
  let socials: { platform: string; url: string }[] = [];
  try {
    const raw = author.socialLinks;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    if (Array.isArray(parsed)) {
      socials = parsed.filter((s: any) => s.url?.trim());
    } else if (typeof parsed === 'object' && parsed !== null) {
      socials = Object.entries(parsed).map(([platform, url]) => ({ platform, url: url as string })).filter(s => s.url?.trim());
    }
  } catch { socials = []; }

  // Fetch articles
  // The list is capped, so the view total cannot be summed from it -- that
  // would silently under-report as soon as an author passes the cap. Postgres
  // does the sum over every row instead, which is one cheap indexed aggregate.
  const authorArticleWhere = and(
    eq(articleTable.status, "PUBLISHED"),
    or(eq(articleTable.authorId, author.id), author.name ? eq(articleTable.author, author.name) : undefined)
  );

  const [articles, viewsAggregate] = await Promise.all([
    db.query.article.findMany({
      where: authorArticleWhere,
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      limit: LISTING_ARTICLE_LIMIT,
      columns: ARTICLE_CARD_COLUMNS,
      with: ARTICLE_CARD_WITH,
    }),
    db.select({ totalViews: sum(articleTable.views) }).from(articleTable).where(authorArticleWhere),
  ]);

  const totalViews = Number(viewsAggregate?.[0]?.totalViews) || 0;

  return (
    <AuthorProfileView 
      author={author} 
      articles={articles} 
      socials={socials} 
      totalViews={totalViews} 
    />
  );
}
