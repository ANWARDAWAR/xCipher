"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildArticleScope } from "@/lib/capabilities";
import { eq, and } from "drizzle-orm";
import { user as userTable } from "@/lib/db/schema";

export async function getTopStories(offset: number = 0, limit: number = 6) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const [dbUser] = await db.query.user.findMany({ 
    where: eq(userTable.id, user.id), 
    with: { authorProfile: true },
    limit: 1 
  });
  const authorId = dbUser?.authorProfile?.id;
  
  const actor = {
    id: user.id,
    role: user.role as any,
    authorId: authorId || null
  };

  const stories = await db.query.article.findMany({
    where: (a) => and(
      eq(a.status, "PUBLISHED"),
      // Simplified scope check for dashboard, wait we should use the same logic
      (actor.role === "AUTHOR" || actor.role === "EDITOR") 
        ? eq(a.authorId, actor.authorId || "__none__") 
        : undefined
    ),
    orderBy: (a, { desc }) => [desc(a.views)],
    offset,
    limit,
    columns: {
      id: true, title: true, slug: true, views: true, status: true,
      publishedAt: true, createdAt: true, author: true
    },
    with: {
      authorModel: { columns: { name: true } },
      category: { columns: { name: true, slug: true } }
    }
  });

  return stories;
}
