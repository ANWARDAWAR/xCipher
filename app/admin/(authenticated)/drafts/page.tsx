import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DeleteArticleButton from "@/components/editorial/DeleteArticleButton";

export const dynamic = "force-dynamic";

export default async function AdminDrafts() {
  let drafts: any[] = [];
  try {
    const user = await getCurrentUser();
    drafts = await db.article.findMany({
      where: user?.role === "AUTHOR" ? { status: "DRAFT", authorId: user.id } : { status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      include: { category: true },
    });
  } catch (error) {
    console.error("AdminDrafts fetch error:", error);
  }

  return (
    <>
      <h1>Drafts</h1>
      <p className="cs-sub">{drafts.length} drafts in the database.</p>
      
      <div className="cs-card">
        {drafts.length > 0 ? (
          drafts.map(d => (
            <div className="cs-row" key={d.id}>
              <span className="t">{d.title || "Untitled story"}</span>
              <span className="m">{d.category?.name || "None"}</span>
              <span className="m">{d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
              <Link href={`/admin/editor/${d.id}`} className="act">Edit</Link>
              <Link href={`/article/${d.slug}`} target="_blank" className="act">Preview</Link>
              <DeleteArticleButton id={d.id} title={d.title} />
            </div>
          ))
        ) : (
          <p className="cs-sub" style={{ margin: 0 }}>Nothing here yet.</p>
        )}
        <p style={{ marginTop: "16px" }}>
          <Link href="/admin/editor" className="btn-cs primary">+ New story</Link>
        </p>
      </div>
    </>
  );
}
