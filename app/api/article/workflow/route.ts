import { NextRequest, NextResponse } from "next/server";
import { submitArticle, publishArticle, rejectArticle, requestChanges, claimReview, releaseReview, takeOverReview } from "@/app/actions/workflow";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { action, articleId, category, notes } = await req.json();
    if (action === "submit") {
      const result = await submitArticle(articleId);
      return NextResponse.json(result);
    } else if (action === "publish") {
      const result = await publishArticle(articleId);
      return NextResponse.json(result);
    } else if (action === "reject") {
      const result = await rejectArticle(articleId, category, notes);
      return NextResponse.json(result);
    } else if (action === "requestChanges") {
      const result = await requestChanges(articleId, notes);
      return NextResponse.json(result);
    } else if (action === "claim") {
      const result = await claimReview(articleId);
      return NextResponse.json(result);
    } else if (action === "release") {
      const result = await releaseReview(articleId);
      return NextResponse.json(result);
    } else if (action === "takeOver") {
      const result = await takeOverReview(articleId, true);
      return NextResponse.json(result);
    } else if (action === "restore") {
      const { restoreRevision } = await import("@/app/actions/article");
      const result = await restoreRevision(articleId);
      return NextResponse.json(result);
    } else if (action === "archive") {
      const { archiveArticle } = await import("@/app/actions/workflow");
      const result = await archiveArticle(articleId);
      return NextResponse.json(result);
    } else if (action === "deletePermanently") {
      const { deleteArticlePermanently } = await import("@/app/actions/workflow");
      const result = await deleteArticlePermanently(articleId);
      return NextResponse.json(result);
    } else if (action === "deleteOwnDraft") {
      const { deleteOwnDraft } = await import("@/app/actions/workflow");
      const result = await deleteOwnDraft(articleId);
      return NextResponse.json(result);
    } else if (action === "incrementView") {
      const { incrementArticleView } = await import("@/app/actions/article");
      const result = await incrementArticleView(articleId);
      return NextResponse.json(result);
    }
    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: any) {
    console.error("[api/article/workflow] Error:", error);
    return NextResponse.json({ success: false, error: "An unexpected error occurred." }, { status: 500 });
  }
}
