import Link from "next/link";
import { fmtViews } from "@/lib/utils";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DeleteArticleButton from "@/components/editorial/DeleteArticleButton";

export const dynamic = "force-dynamic";

export default async function AdminArticles() {
  let articles: any[] = [];
  try {
    const user = await getCurrentUser();
    articles = await db.article.findMany({
      where: user?.role === "AUTHOR" ? { status: "PUBLISHED", authorId: user.id } : { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      include: { category: true },
    });
  } catch (error) {
    console.error("AdminArticles fetch error:", error);
  }

  return (
    <>
      <h1>Articles</h1>
      <p className="cs-sub">{articles.length} published stories in the live index.</p>
      <div className="cs-card">
        {articles.length > 0 ? (
          articles.map(a => (
            <div className="cs-row" key={a.id}>
              <span className="t">{a.title}</span>
              <span className="m">{a.category?.name || "None"}</span>
              <span className="m">{a.createdAt ? new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
              <span className="m">{fmtViews(a.views || 0)} reads</span>
              <Link className="act" href={`/article/${a.slug}`} target="_blank">Open</Link>
              <Link href={`/admin/editor/${a.id}`} className="act">Edit</Link>
              <DeleteArticleButton id={a.id} title={a.title} />
            </div>
          ))
        ) : (
          <p className="cs-sub" style={{ margin: 0 }}>Nothing here yet.</p>
        )}
      </div>
    </>
  );
}
