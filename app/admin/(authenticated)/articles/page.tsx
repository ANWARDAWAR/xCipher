import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import StoryDataTable from "@/components/editorial/StoryDataTable";

export const dynamic = "force-dynamic";

export default async function AdminArticles() {
  let articles: any[] = [];
  const user = await getCurrentUser();
  const dbUser = user ? await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } }) : null;
  const authorId = dbUser?.authorProfile?.id;
  const isAuthorOnly = user?.role === "AUTHOR";

  try {
    articles = await db.article.findMany({
      where: isAuthorOnly ? { status: "PUBLISHED", authorId: authorId || "none" } : { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: { category: true, authorModel: true },
    });
  } catch (error) {
    console.error("AdminArticles fetch error:", error);
  }

  return (
    <>
      <h1>{isAuthorOnly ? "My Published Stories" : "All Published Stories"}</h1>
      <p className="cs-sub">{articles.length} published stories in the live index.</p>
      <StoryDataTable articles={articles} showStatusBadge={false} userRole={user?.role} emptyMessage="No published stories found." />
    </>
  );
}
