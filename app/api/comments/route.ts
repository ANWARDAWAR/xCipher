import { NextRequest, NextResponse } from "next/server";
import { postComment } from "@/app/actions/comments";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const data = await req.formData();
    const slug = data.get("slug") as string;
    const result = await postComment(slug, data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[api/comments] Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
