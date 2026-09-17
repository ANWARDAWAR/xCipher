import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGES } from "@/lib/mockData";

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
    <div 
      className="wrap page-static" 
      dangerouslySetInnerHTML={{ __html: page.h }} 
    />
  );
}
