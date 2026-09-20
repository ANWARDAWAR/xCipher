import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ARTICLE_CARD_SELECT, LISTING_PAGE_SIZE } from "@/lib/queries";
import AuthorProfileView from "@/components/author/AuthorProfileView";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Accepts only a clean positive integer; anything else means page 1. */
function parsePageParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const n = value ? parseInt(value, 10) : 1;
  return Number.isFinite(n) && n > 1 ? Math.floor(n) : 1;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);
  const author = await db.author.findUnique({ where: { slug }, include: { user: true } });
  if (!author) return { title: "Author — xSypher" };
  return {
    title: page > 1 ? `${author.name} — Page ${page} — xSypher` : `${author.name} — xSypher`,
    description: author.headline || author.bio?.slice(0, 160) || `${author.name} on xSypher.`,
    alternates: {
      canonical: page > 1 ? `/author/${author.slug}?page=${page}` : `/author/${author.slug}`,
    },
    openGraph: {
      title: `${author.name} — xSypher`,
      description: author.bio?.slice(0, 160) || "",
      images: author.avatar ? [author.avatar] : [],
    },
  };
}

// These listings render per-request now: pagination reads `searchParams`,
// which is a dynamic API. That is a deliberate trade -- URL-addressable
// archive pages (crawlable, shareable) over route-level caching -- and it
// costs almost nothing, because the article rows themselves come from a
// tagged unstable_cache entry with the TTL below. Publishing still calls
// revalidateTag for exactly the segments involved, so an editorial change
// appears immediately; the window is only the ceiling for anything that
// changes without an explicit invalidation, such as a view count.
export const revalidate = 600; // listing data TTL via unstable_cache

export default async function AuthorProfile({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = parsePageParam(sp.page);

  const author = await db.author.findUnique({ where: { slug }, include: { user: true } });
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

  // Fetch articles. Paginated like every other public listing: a productive
  // author's archive used to stop at a hard cap, after which their older work
  // vanished from their own profile.
  const authorArticleWhere = {
    status: "PUBLISHED" as const,
    OR: [{ authorId: author.id }, { author: author.name }],
  };

  // One extra row past the page size answers "is there a next page"; the row
  // count answers the profile's stats header. The view total stays an
  // aggregate over every row, never the sum of the current page.
  const [rows, totalCount, viewsAggregate] = await Promise.all([
    db.article.findMany({
      where: authorArticleWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * LISTING_PAGE_SIZE,
      take: LISTING_PAGE_SIZE + 1,
      select: ARTICLE_CARD_SELECT,
    }),
    db.article.count({ where: authorArticleWhere }),
    db.article.aggregate({ where: authorArticleWhere, _sum: { views: true } }),
  ]);

  const hasNextPage = rows.length > LISTING_PAGE_SIZE;
  const articles = rows.slice(0, LISTING_PAGE_SIZE);
  const totalViews = viewsAggregate._sum.views || 0;

  if (articles.length === 0 && page > 1) {
    notFound();
  }

  return (
    <AuthorProfileView
      author={author}
      articles={articles}
      socials={socials}
      totalViews={totalViews}
      totalCount={totalCount}
      page={page}
      hasNextPage={hasNextPage}
    />
  );
}
