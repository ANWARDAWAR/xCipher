import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGES } from "@/lib/mockData";
import { sanitizeArticleHtml } from "@/lib/sanitize";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  
  if (!page) {
    return {};
  }
  
  return {
    title: `${page.t} — xCipher`,
  };
}

export default async function StaticPage({ params }: Props) {
  const { slug } = await params;
  const page = PAGES[slug];
  
  if (!page) {
    notFound();
  }

  return (
    <main className="wrap p-page">
      <h1 className="p-title">{page.t}</h1>
      <div 
        className="p-body prose" 
        dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(page.h) }} 
      />
    </main>
  );
}
