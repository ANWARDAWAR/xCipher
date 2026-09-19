"use server";

import { v2 as cloudinary } from "cloudinary";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import {
  MAX_UPLOAD_BYTES,
  formatBytes,
  sniffImageMime,
} from "@/lib/upload-constraints";

// ─────────────────────────────────────────────────────────────────────────────
// Avatar upload — Cloudinary
// ─────────────────────────────────────────────────────────────────────────────
//
// Avatars go to Cloudinary rather than R2 because the transformation pipeline
// is the reason to use it here: one stored original serves every size the site
// needs, and face-aware cropping keeps a head centred in a circular frame
// without anyone hand-cropping it. Article images get none of that benefit --
// they are placed by an editor at a known size -- so they stay on R2, which is
// cheaper per byte.
//
// Same defence-in-depth as the article path: authenticate, authorise, check the
// bytes rather than the declared type, and let the provider re-encode.
// ─────────────────────────────────────────────────────────────────────────────

export interface AvatarUploadResult {
  ok: boolean;
  /** Delivery URL with transformations already applied. */
  url?: string;
  error?: string;
}

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function getCloudinaryConfig(): CloudinaryConfig | { error: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const missing = [
    !cloudName && "CLOUDINARY_CLOUD_NAME",
    !apiKey && "CLOUDINARY_API_KEY",
    !apiSecret && "CLOUDINARY_API_SECRET",
  ].filter(Boolean);

  if (missing.length) {
    return { error: `Avatar uploads are not configured. Missing: ${missing.join(", ")}.` };
  }

  return { cloudName: cloudName!, apiKey: apiKey!, apiSecret: apiSecret! };
}

export async function uploadAvatar(formData: FormData): Promise<AvatarUploadResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sign in to upload an avatar." };
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { role: true, isActive: true },
  });

  if (!dbUser?.isActive) {
    return { ok: false, error: "This account is not active." };
  }

  // Everyone with a console account has a profile to maintain, so the bar is
  // the ability to edit one's own -- not article authorship.
  if (!authorize(dbUser.role, "author.manage.own")) {
    return { ok: false, error: "You do not have permission to upload an avatar." };
  }

  const config = getCloudinaryConfig();
  if ("error" in config) {
    return { ok: false, error: config.error };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return { ok: false, error: "No file was received." };
  }

  const blob = file as File;

  if (blob.size === 0) return { ok: false, error: "That file is empty." };

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

  // Declared type is not trusted; the signature is.
  if (!sniffImageMime(input)) {
    return {
      ok: false,
      error: "That file is not a JPEG, PNG, WebP or GIF. Renaming a file does not change its format.",
    };
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  try {
    const uploaded = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "xsypher/avatars",
            resource_type: "image",
            // Cloudinary would otherwise derive the public id from the original
            // filename, which is both a collision risk and a way for a user to
            // choose where their file lands.
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            // Applied once, at upload: store a square, face-centred 512px
            // original. Every delivery size is then derived from this rather
            // than from a multi-megabyte camera file.
            transformation: [
              { width: 512, height: 512, crop: "fill", gravity: "face" },
              { fetch_format: "auto", quality: "auto" },
            ],
          },
          (error, result) => {
            if (error || !result) {
              reject(error ?? new Error("Cloudinary returned no result"));
              return;
            }
            resolve({ secure_url: result.secure_url, public_id: result.public_id });
          }
        );
        stream.end(input);
      }
    );

    return { ok: true, url: uploaded.secure_url };
  } catch (e) {
    // The Cloudinary error can echo the api key, so it is logged, not returned.
    console.error("[upload-avatar] Cloudinary upload failed:", e);
    return { ok: false, error: "The avatar could not be uploaded. Please try again." };
  }
}
