"use server";

import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { uploadFileToR2, buildObjectKey, getR2Config } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, formatBytes, sniffImageMime, MAX_IMAGE_WIDTH, WEBP_QUALITY } from "@/lib/upload-constraints";
import sharp from "sharp";

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
    const config = getR2Config();
    if ("error" in config) {
      return { ok: false, error: config.error };
    }

    const processedBuffer = await sharp(input)
      .resize(MAX_IMAGE_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      
      .toBuffer();

    const key = buildObjectKey("xsypher/articles", "webp");
    const blobToUpload = new Blob([processedBuffer], { type: "image/webp" });
    const url = await uploadFileToR2(blobToUpload, config.bucket, key);
    
    return {
      ok: true,
      url,
      width: undefined,
      height: undefined,
    };
  } catch (e) {
    console.error("[upload-article-image] Image processing or R2 upload failed:", e);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }
}

export async function processExternalImage(url: string): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to process images." };
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

  if (!url || typeof url !== "string") {
    return { ok: false, error: "Invalid URL provided." };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "xSypher-Bot/1.0",
        "Accept": "image/jpeg, image/png, image/webp, image/gif"
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      return { ok: false, error: `Failed to fetch external image: ${response.statusText}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    const input = Buffer.from(arrayBuffer);

    if (input.byteLength > MAX_UPLOAD_BYTES) {
      return { ok: false, error: `That image exceeds ${formatBytes(MAX_UPLOAD_BYTES)}.` };
    }

    const config = getR2Config();
    if ("error" in config) {
      return { ok: false, error: config.error };
    }

    const processedBuffer = await sharp(input)
      .resize(MAX_IMAGE_WIDTH, null, { withoutEnlargement: true, fit: 'inside' })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const key = buildObjectKey("xsypher/articles/external", "webp");
    const blobToUpload = new Blob([processedBuffer], { type: "image/webp" });
    const finalUrl = await uploadFileToR2(blobToUpload, config.bucket, key);
    
    return {
      ok: true,
      url: finalUrl
    };
  } catch (e) {
    console.error("[processExternalImage] Image processing or R2 upload failed:", e);
    return { ok: false, error: "Failed to import image from this URL. The host may be blocking downloads." };
  }
}

