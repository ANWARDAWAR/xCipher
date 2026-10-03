import type { NextRequest } from "next/server";
import { upsertArticle } from "@/app/actions/article";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await upsertArticle(data);
    return Response.json(result);
  } catch (error: unknown) {
    console.error("[api/article/upsert] Error:", error);
    return Response.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
