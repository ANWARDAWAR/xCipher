import { NextRequest, NextResponse } from "next/server";
import { processExternalImage } from "@/app/actions/upload-article-image";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ ok: false, error: "No URL provided." }, { status: 400 });
    }
    const res = await processExternalImage(url);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("[api/upload/external] Error:", error);
    return NextResponse.json({ ok: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
