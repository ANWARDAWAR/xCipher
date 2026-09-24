"use server";

import { db } from "@/lib/db";

export type LiveSearchResult = {
  id: string;
  slug: string;
  title: string;
  publishedAt: Date | null;
  category: { name: string } | null;
};

export async function getLiveSearchResults(query: string): Promise<LiveSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const cleanQuery = query.trim();

  const results = await db.article.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: cleanQuery, mode: "insensitive" } },
        { deck: { contains: cleanQuery, mode: "insensitive" } },
        { tags: { some: { name: { contains: cleanQuery, mode: "insensitive" } } } }
      ]
    },
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      category: {
        select: { name: true }
      }
    },
    take: 6,
    orderBy: { publishedAt: "desc" }
  });

  return results;
}
