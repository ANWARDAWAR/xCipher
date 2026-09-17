import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
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
  const articles = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ authorId: author.id }, { author: author.name }],
    },
    orderBy: { createdAt: "desc" },
    include: { category: true },
  });

  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0);

  return (
    <AuthorProfileView 
      author={author} 
      articles={articles} 
      socials={socials} 
      totalViews={totalViews} 
    />
  );
}
