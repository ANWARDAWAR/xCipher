"use server";

import { z } from "zod";
import { queryPublicFeed, type FeedFilter } from "@/lib/feed";

const inputSchema = z.object({
  offset: z.number().int().min(0).max(2147483587),
  limit: z.number().int().min(1).max(60),
  filter: z.object({
    categorySlug: z.string().trim().min(1).max(200).optional(),
    subcategorySlug: z.string().trim().min(1).max(200).optional(),
    tagSlug: z.string().trim().min(1).max(200).optional(),
    authorId: z.string().trim().min(1).max(200).optional(),
  }).strict().refine(value => !value.subcategorySlug || !!value.categorySlug).optional(),
});

export async function getMoreArticles(offset: number, limit: number, filter?: FeedFilter) {
  const input = inputSchema.safeParse({ offset, limit, filter });
  if (!input.success) throw new Error("Invalid feed request.");

  try {
    return await queryPublicFeed(input.data.offset, input.data.limit, input.data.filter);
  } catch (error) {
    console.error("[feed] Could not load articles:", error);
    throw new Error("Could not load more articles. Please try again.");
  }
}
