import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGES } from "@/lib/mockData";
import { sanitizeArticleHtml } from "@/lib/sanitize";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * These pages come from a hardcoded object, so every valid slug is known at
 * build time and all of them can be pre-rendered. There is no database call
 * here, which is why this route was already the fastest on the site.
 */
export function generateStaticParams() {
  return Object.keys(PAGES).map((slug) => ({ slug }));
}

/** Nothing here reads a request, so the output never needs to be recomputed
 *  per visitor. A slug outside PAGES still 404s through notFound(). */
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = PAGES[slug];
  
  if (!page) {
    return {};
  }
  
  return {
    title: `${page.t} — xSypher`,
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
