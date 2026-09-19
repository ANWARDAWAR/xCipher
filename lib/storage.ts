import { S3Client } from "@aws-sdk/client-s3";

// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare R2 client
// ─────────────────────────────────────────────────────────────────────────────
//
// R2 speaks the S3 API, so the AWS SDK drives it. Only the endpoint and the
// fixed "auto" region differ.
//
// Constructed lazily rather than at module scope. A top-level `new S3Client()`
// runs the moment anything imports this file -- including during `next build`,
// where the credentials are usually absent -- and the failure surfaces as an
// unrelated build error rather than "R2 is not configured". The same mistake
// already bit this codebase with `new Resend(undefined)`.
// ─────────────────────────────────────────────────────────────────────────────

let client: S3Client | null = null;

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  /** Public base URL the bucket is served from, e.g. https://media.example.com
   *  or the r2.dev subdomain. No trailing slash. */
  publicBase: string;
}

/** Read and validate configuration, or explain precisely what is missing. */
export function getR2Config(): R2Config | { error: string } {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;
  const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE;

  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET",
    !publicBase && "NEXT_PUBLIC_R2_PUBLIC_BASE",
  ].filter(Boolean);

  if (missing.length) {
    // Named rather than a generic failure: an operator seeing this in a log
    // should not have to read the source to find out which variable is unset.
    return { error: `Image uploads are not configured. Missing: ${missing.join(", ")}.` };
  }

  return {
    accountId: accountId!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    bucket: bucket!,
    publicBase: publicBase!.replace(/\/+$/, ""),
  };
}

export function getR2Client(config: R2Config): S3Client {
  if (client) return client;

  client = new S3Client({
    // R2 has no regions; the SDK requires the field, and "auto" is what
    // Cloudflare documents.
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return client;
}

/**
 * Object key for an uploaded image.
 *
 * Content-addressed by a random id rather than the original filename. Three
 * reasons: two people uploading "screenshot.png" must not collide; a filename
 * can carry path separators and traversal sequences; and a predictable key
 * would let anyone enumerate the bucket. The date prefix is for humans reading
 * a bucket listing, not for routing.
 */
export function buildObjectKey(prefix: string, extension: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  return `${prefix}/${yyyy}/${mm}/${id}.${extension}`;
}
