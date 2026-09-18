import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ARTICLE_CARD_SELECT, LISTING_ARTICLE_LIMIT } from "@/lib/queries";
import AuthorProfileView from "@/components/author/AuthorProfileView";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await db.author.findUnique({ where: { slug } });
  if (!author) return { title: "Author — xCipher" };
  return {
    title: `${author.name} — xCipher`,
    description: author.headline || author.bio?.slice(0, 160) || `${author.name} on xCipher.`,
    openGraph: {
      title: `${author.name} — xCipher`,
      description: author.bio?.slice(0, 160) || "",
      images: author.avatar ? [author.avatar] : [],
    },
  };
}

export const dynamic = "force-dynamic";

export default async function AuthorProfile({ params }: Props) {
  const { slug } = await params;

  const author = await db.author.findUnique({ where: { slug } });
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
  const authorArticleWhere = {
    status: "PUBLISHED" as const,
    OR: [{ authorId: author.id }, { author: author.name }],
  };

  // The list is capped, so the view total cannot be summed from it -- that
  // would silently under-report as soon as an author passes the cap. Postgres
  // does the sum over every row instead, which is one cheap indexed aggregate.
  const [articles, viewsAggregate] = await Promise.all([
    db.article.findMany({
      where: authorArticleWhere,
      orderBy: { createdAt: "desc" },
      take: LISTING_ARTICLE_LIMIT,
      select: ARTICLE_CARD_SELECT,
    }),
    db.article.aggregate({ where: authorArticleWhere, _sum: { views: true } }),
  ]);

  const totalViews = viewsAggregate._sum.views || 0;

  return (
    <AuthorProfileView 
      author={author} 
      articles={articles} 
      socials={socials} 
      totalViews={totalViews} 
    />
  );
}
