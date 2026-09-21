"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getCurrentUser } from "@/lib/auth";
import { hasRequiredRole } from "@/lib/permissions";
import { Role, CommentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

// ─── Safe public shape returned to readers ──────────────────────────────────
export interface PublicComment {
  id: string;
  displayName: string;
  emailHash: string; // for Gravatar — safe to expose
  body: string;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sha256(input: string): string {
  return createHash("sha256").update(input.toLowerCase().trim()).digest("hex");
}

const nameSchema = z.string().min(1).max(60).trim();
const emailSchema = z.string().email().max(320).toLowerCase().trim();
const bodySchema = z.string().min(10).max(1200).trim();

// ─── Get approved comments for an article ───────────────────────────────────
export async function getComments(articleSlug: string): Promise<PublicComment[]> {
  if (!articleSlug || typeof articleSlug !== "string") return [];

  const comments = await db.comment.findMany({
    where: { articleSlug, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, emailHash: true, body: true, createdAt: true },
  });

  return comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));
}

// ─── Get comment count for an article (for SSR display) ─────────────────────
export async function getCommentCount(articleSlug: string): Promise<number> {
  if (!articleSlug || typeof articleSlug !== "string") return 0;
  return db.comment.count({ where: { articleSlug, status: "APPROVED" } });
}

// ─── Post a comment ──────────────────────────────────────────────────────────
export async function postComment(
  articleSlug: string,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  // Rate limit: 5 comments per 10 minutes per IP
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await checkRateLimit("comment", ip, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return { success: false, error: "Too many submissions. Please wait a few minutes and try again." };
  }

  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawBody = formData.get("comment");

  const nameResult = nameSchema.safeParse(rawName);
  const emailResult = emailSchema.safeParse(rawEmail);
  const bodyResult = bodySchema.safeParse(rawBody);

  if (!nameResult.success) return { success: false, error: "Name is required (max 60 characters)." };
  if (!emailResult.success) return { success: false, error: "A valid email address is required." };
  if (!bodyResult.success) {
    return {
      success: false,
      error: bodyResult.error.issues[0]?.message?.includes("too_small")
        ? "Comment must be at least 10 characters."
        : "Comment must be 1200 characters or fewer.",
    };
  }

  // Find article by slug to get its ID
  const article = await db.article.findUnique({
    where: { slug: articleSlug },
    select: { id: true, status: true },
  });

  if (!article || article.status !== "PUBLISHED") {
    return { success: false, error: "Article not found or not published." };
  }

  const emailHash = sha256(emailResult.data);
  const ipHash = sha256(ip);
  const ua = hdrs.get("user-agent") || undefined;

  try {
    await db.comment.create({
      data: {
        articleId: article.id,
        articleSlug,
        displayName: nameResult.data,
        emailHash,
        body: bodyResult.data,
        status: "PENDING",
        ipHash,
        userAgent: ua?.slice(0, 500) ?? null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[comments] postComment error:", error);
    return { success: false, error: "Failed to submit comment. Please try again." };
  }
}

// ─── Moderate a comment (MODERATOR+ only) ────────────────────────────────────
export async function moderateComment(
  commentId: string,
  action: "APPROVED" | "REJECTED" | "SPAM",
  note?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthenticated" };

  const canModerate = hasRequiredRole(user.role as Role, "MODERATOR");
  if (!canModerate) return { success: false, error: "Insufficient permissions to moderate comments." };

  if (!commentId || typeof commentId !== "string") {
    return { success: false, error: "Invalid comment ID." };
  }

  const validActions: CommentStatus[] = ["APPROVED", "REJECTED", "SPAM"];
  if (!validActions.includes(action as CommentStatus)) {
    return { success: false, error: "Invalid moderation action." };
  }

  try {
    const comment = await db.comment.findUnique({ where: { id: commentId } });
    if (!comment) return { success: false, error: "Comment not found." };

    await db.comment.update({
      where: { id: commentId },
      data: {
        status: action as CommentStatus,
        moderatorId: user.id,
        moderatorNote: note?.trim().slice(0, 500) || null,
      },
    });

    revalidatePath(`/article/${comment.articleSlug}`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("[comments] moderateComment error:", error);
    return { success: false, error: "Failed to update comment status." };
  }
}

// ─── Get pending comments queue (MODERATOR+ only) ────────────────────────────
export async function getPendingComments(page = 1) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthenticated", comments: [] };

  const canModerate = hasRequiredRole(user.role as Role, "MODERATOR");
  if (!canModerate) return { success: false, error: "Insufficient permissions.", comments: [] };

  const perPage = 20;
  const skip = (page - 1) * perPage;

  const [comments, total] = await Promise.all([
    db.comment.findMany({
      where: { status: { in: ["PENDING", "SPAM"] } },
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        articleSlug: true,
        displayName: true,
        body: true,
        status: true,
        ipHash: true,
        createdAt: true,
        moderatorNote: true,
        moderator: { select: { name: true } },
      },
    }),
    db.comment.count({ where: { status: { in: ["PENDING", "SPAM"] } } }),
  ]);

  return { success: true, comments, total, pages: Math.ceil(total / perPage) };
}
