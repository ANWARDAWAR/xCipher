"use server";

import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { uploadImageToCloudinary } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, formatBytes, sniffImageMime } from "@/lib/upload-constraints";

export interface UploadResult {
  ok: boolean;
  url?: string;
  width?: number;
  height?: number;
  error?: string;
}

export async function uploadArticleImage(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to upload images." };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser?.isActive) {
    return { ok: false, error: "This account is not active." };
  }

  if (!authorize(dbUser.role, "article.create")) {
    return { ok: false, error: "You do not have permission to upload images." };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { ok: false, error: "No file was received." };
  }

  const blob = file as File;

  if (blob.size === 0) {
    return { ok: false, error: "That file is empty." };
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That image is ${formatBytes(blob.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
    };
  }

  const input = Buffer.from(await blob.arrayBuffer());

  if (input.byteLength > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `That image exceeds ${formatBytes(MAX_UPLOAD_BYTES)}.` };
  }

  const sniffed = sniffImageMime(input);
  if (!sniffed) {
    return {
      ok: false,
      error: "That file is not a JPEG, PNG, WebP or GIF. Renaming a file does not change its format.",
    };
  }

  try {
    const url = await uploadImageToCloudinary(blob, "xsypher/articles");
    
    return {
      ok: true,
      url,
      width: undefined,
      height: undefined,
    };
  } catch (e) {
    console.error("[upload-article-image] Cloudinary upload failed:", e);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }
}
