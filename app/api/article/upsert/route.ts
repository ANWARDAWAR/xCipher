import { NextRequest, NextResponse } from "next/server";
import { upsertArticle } from "@/app/actions/article";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await upsertArticle(data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/article/upsert] Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
