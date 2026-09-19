"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { getR2Client, getR2Config, buildObjectKey } from "@/lib/storage";
import {
  MAX_UPLOAD_BYTES,
  MAX_IMAGE_WIDTH,
  WEBP_QUALITY,
  formatBytes,
  sniffImageMime,
} from "@/lib/upload-constraints";

// ─────────────────────────────────────────────────────────────────────────────
// Article image upload — Cloudflare R2
// ─────────────────────────────────────────────────────────────────────────────
//
// Takes the raw file, re-encodes it, and stores it under a key the caller does
// not choose. Credentials never leave the server; the browser receives only the
// finished public URL.
//
// The order of checks matters and is deliberate:
//
//   1. authenticated                — cheapest, and everything else is moot
//   2. authorised to write articles — an upload endpoint open to any signed-in
//                                     account is free file hosting
//   3. size, from the actual buffer — not the Content-Length header
//   4. format, from the leading bytes — not the declared MIME type
//   5. re-encode through sharp      — the real barrier; see below
//
// Re-encoding is what makes this safe rather than merely validated. sharp
// decodes the pixels and writes a new file, so anything that was not image data
// -- a polyglot carrying script, EXIF with an injected payload, a malformed
// header aimed at a decoder bug downstream -- does not survive the round trip.
// It also strips metadata, which routinely includes the GPS coordinates of
// wherever the photograph was taken.
// ─────────────────────────────────────────────────────────────────────────────

export interface UploadResult {
  ok: boolean;
  url?: string;
  width?: number;
  height?: number;
  /** Human-readable, safe to show the author. */
  error?: string;
}

export async function uploadArticleImage(formData: FormData): Promise<UploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to upload images." };
  }

  // Role is read from the database, not the session, for the same reason every
  // other guard in this codebase does: a session can be stale after a demotion.
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser?.isActive) {
    return { ok: false, error: "This account is not active." };
  }

  // Anyone who can write an article can illustrate it. Anyone who cannot has no
  // reason to put bytes in our bucket.
  if (!authorize(dbUser.role, "article.create")) {
    return { ok: false, error: "You do not have permission to upload images." };
  }

  const config = getR2Config();
  if ("error" in config) {
    return { ok: false, error: config.error };
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

  // Re-check the size against the bytes actually received. blob.size is
  // metadata; this is the payload.
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

  let output: Buffer;
  let width: number;
  let height: number;
  let extension: string;
  let contentType: string;

  try {
    const pipeline = sharp(input, {
      // A bomb is a small file that decodes to an enormous bitmap. Capping
      // input pixels makes sharp refuse it before allocating the memory.
      limitInputPixels: 50_000_000,
      // Animated GIFs must be read as all frames or the re-encode keeps only
      // the first one and silently turns the animation into a still.
      animated: sniffed === "image/gif",
    });

    const meta = await pipeline.metadata();

    // Only downscale. Enlarging a small image adds bytes and no detail.
    const needsResize = (meta.width ?? 0) > MAX_IMAGE_WIDTH;
    const resized = needsResize
      ? pipeline.resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      : pipeline;

    if (sniffed === "image/gif") {
      // Animation is the whole point of a GIF here, and WebP keeps it at a
      // fraction of the size. Converting to a static WebP would destroy the
      // content the author chose the format for.
      output = await resized.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
      extension = "webp";
      contentType = "image/webp";
    } else {
      output = await resized.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
      extension = "webp";
      contentType = "image/webp";
    }

    const outMeta = await sharp(output, { animated: sniffed === "image/gif" }).metadata();
    width = outMeta.width ?? meta.width ?? 0;
    // pageHeight is the per-frame height for an animated image; height is the
    // filmstrip total, which would be wrong to report.
    height = outMeta.pageHeight ?? outMeta.height ?? meta.height ?? 0;
  } catch {
    // A decode failure here means the bytes passed the signature check but are
    // not a usable image -- truncated, or corrupt.
    return { ok: false, error: "That image could not be processed. It may be corrupt." };
  }

  const key = buildObjectKey("articles", extension);

  try {
    const client = getR2Client(config);
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: key,
        Body: output,
        ContentType: contentType,
        // Immutable: the key contains a UUID, so this exact object never
        // changes. Lets the CDN and the browser keep it indefinitely.
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
  } catch (e) {
    // The underlying error can name the bucket and endpoint, so it goes to the
    // server log rather than to the author.
    console.error("[upload-article-image] R2 put failed:", e);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }

  return {
    ok: true,
    url: `${config.publicBase}/${key}`,
    width,
    height,
  };
}
