"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { buildArticleScope } from "@/lib/capabilities";

export async function getTopStories(offset: number = 0, limit: number = 6) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const dbUser = await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } });
  const authorId = dbUser?.authorProfile?.id;
  
  const actor = {
    id: user.id,
    role: user.role as any,
    authorId: authorId || null
  };

  const scopeWhere = buildArticleScope(actor);
  const wherePublished = { ...scopeWhere, status: "PUBLISHED" as const };

  const stories = await db.article.findMany({
    where: wherePublished,
    orderBy: { views: "desc" },
    skip: offset,
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      views: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      author: true,
      authorModel: { select: { name: true } },
      category: { select: { name: true, slug: true } },
    },
  });

  return stories;
}
