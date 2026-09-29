// ─────────────────────────────────────────────────────────────────────────────
// Cloudflare R2 client
// ─────────────────────────────────────────────────────────────────────────────

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  publicBase: string;
}

export function getR2Config(): R2Config | { error: string } {
  // Indirect access keeps NEXT_PUBLIC_* from being frozen by the Next.js build.
  const env = process.env;
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET;
  const rawPublicBase = (env.NEXT_PUBLIC_R2_PUBLIC_BASE || "").trim();

  const missing = [
    !accountId && "R2_ACCOUNT_ID",
    !accessKeyId && "R2_ACCESS_KEY_ID",
    !secretAccessKey && "R2_SECRET_ACCESS_KEY",
    !bucket && "R2_BUCKET",
    !rawPublicBase && "NEXT_PUBLIC_R2_PUBLIC_BASE",
  ].filter(Boolean);

  if (missing.length) {
    return { error: `Image uploads are not configured. Missing: ${missing.join(", ")}.` };
  }
  
  const publicBase = rawPublicBase.replace(/\/+$/, "");

  return {
    accountId: accountId as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    bucket: bucket as string,
    publicBase,
  };
}

export async function getR2Client(config: R2Config) {
  const { AwsClient } = await import("aws4fetch");
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });
}

export function buildObjectKey(prefix: string, extension: string): string {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = crypto.randomUUID();
  return `${prefix}/${yyyy}/${mm}/${id}.${extension}`;
}

export async function uploadFileToR2(file: File | Blob, bucket: string, key: string): Promise<string> {
  const config = getR2Config();
  if ("error" in config) {
    throw new Error(config.error);
  }
  
  const aws = await getR2Client(config);
  const endpoint = new URL(`https://${config.accountId}.r2.cloudflarestorage.com/${bucket}/${key}`);
  
  const buffer = new Uint8Array(await file.arrayBuffer());
  const type = file.type || "application/octet-stream";
  
  const res = await aws.fetch(endpoint.toString(), {
    method: "PUT",
    body: buffer,
    headers: {
      "Content-Type": type,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`R2 Upload Failed: ${res.status} ${errText}`);
  }
  
  return `${config.publicBase}/${key}`;
}

export async function uploadToR2(key: string, body: string, contentType: string = "application/json"): Promise<string> {
  const config = getR2Config();
  if ("error" in config) throw new Error(config.error);
  
  const aws = await getR2Client(config);
  const endpoint = new URL(`https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`);
  
  const res = await aws.fetch(endpoint.toString(), {
    method: "PUT",
    body: body,
    headers: {
      "Content-Type": contentType,
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`R2 Upload Failed: ${res.status} ${errText}`);
  }
  
  return key; // We store relative path in db
}

export async function fetchFromR2(key: string | null): Promise<any> {
  if (!key) return null;
  const config = getR2Config();
  if ("error" in config) return null;

  try {
    const url = `${config.publicBase}/${key}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    
    const contentType = res.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  } catch (err) {
    return null;
  }
}

export async function deleteKeyFromR2(key: string): Promise<void> {
  if (!key) return;
  const config = getR2Config();
  if ("error" in config) return;

  const aws = await getR2Client(config);
  const endpoint = new URL(`https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`);

  try {
    await aws.fetch(endpoint.toString(), { method: "DELETE" });
  } catch (e) {
    console.error("[storage] Failed to delete key from R2:", e);
  }
}

export async function deleteFileFromR2(url: string): Promise<void> {
  const config = getR2Config();
  if ("error" in config) return;
  if (!url.startsWith(config.publicBase)) return;
  
  const key = url.slice(config.publicBase.length).replace(/^\/+/, "");
  if (!key) return;

  const aws = await getR2Client(config);
  const endpoint = new URL(`https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`);

  try {
    await aws.fetch(endpoint.toString(), { method: "DELETE" });
  } catch (e) {
    console.error("[storage] Failed to delete file from R2:", e);
  }
}

