"use server";

import { db } from "@/lib/db";
import { article, category, _articleToTag, tag } from "@/lib/db/schema";
import { eq, or, and, ilike, exists, sql, desc } from "drizzle-orm";

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

  const results = await db.query.article.findMany({
    where: and(
      eq(article.status, "PUBLISHED"),
      or(
        ilike(article.title, `%${cleanQuery}%`),
        ilike(article.deck, `%${cleanQuery}%`),
        exists(
          db.select({ id: sql`1` })
            .from(_articleToTag)
            .innerJoin(tag, eq(tag.id, _articleToTag.B))
            .where(and(eq(_articleToTag.A, article.id), ilike(tag.name, `%${cleanQuery}%`)))
        )
      )
    ),
    columns: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
    },
    with: {
      category: {
        columns: { name: true }
      }
    },
    limit: 6,
    orderBy: [desc(article.publishedAt)]
  });

  return results;
}
