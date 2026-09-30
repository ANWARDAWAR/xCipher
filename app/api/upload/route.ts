import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { authorize } from "@/lib/capabilities";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { user as userTable } from "@/lib/db/schema";
import { uploadFileToR2, buildObjectKey, getR2Config } from "@/lib/storage";
import { MAX_UPLOAD_BYTES, formatBytes, sniffImageMime } from "@/lib/upload-constraints";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sign in to upload images." }, { status: 401 });
    }

    const [dbUser] = await db.select({ role: userTable.role, isActive: userTable.isActive })
      .from(userTable).where(eq(userTable.id, user.id)).limit(1);

    if (!dbUser?.isActive) {
      return NextResponse.json({ ok: false, error: "This account is not active." }, { status: 403 });
    }

    if (!authorize(dbUser.role, "article.create")) {
      return NextResponse.json({ ok: false, error: "You do not have permission to upload images." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, error: "No file was received." }, { status: 400 });
    }

    const blob = file as File;

    if (blob.size === 0) {
      return NextResponse.json({ ok: false, error: "That file is empty." }, { status: 400 });
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({
        ok: false,
        error: `That image is ${formatBytes(blob.size)}. The limit is ${formatBytes(MAX_UPLOAD_BYTES)}.`,
      }, { status: 400 });
    }

    const arrayBuffer = await blob.arrayBuffer();
    const input = new Uint8Array(arrayBuffer);

    if (input.byteLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ ok: false, error: `That image exceeds ${formatBytes(MAX_UPLOAD_BYTES)}.` }, { status: 400 });
    }

    const sniffed = sniffImageMime(input);
    if (!sniffed) {
      return NextResponse.json({
        ok: false,
        error: "That file is not a JPEG, PNG, WebP or GIF. Renaming a file does not change its format.",
      }, { status: 400 });
    }

    const config = getR2Config();
    if ("error" in config) {
      return NextResponse.json({ ok: false, error: config.error }, { status: 500 });
    }

    const key = buildObjectKey("xsypher/articles", sniffed.split("/")[1]);
    const blobToUpload = new Blob([input], { type: sniffed });
    const url = await uploadFileToR2(blobToUpload, config.bucket, key);
    
    return NextResponse.json({
      ok: true,
      url,
    });
  } catch (e) {
    console.error("[api/upload] Image upload failed:", e);
    return NextResponse.json({ ok: false, error: "The image could not be uploaded. Please try again." }, { status: 500 });
  }
}
