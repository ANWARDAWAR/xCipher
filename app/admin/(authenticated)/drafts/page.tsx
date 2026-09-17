import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import StoryDataTable from "@/components/editorial/StoryDataTable";

export const dynamic = "force-dynamic";

export default async function AdminDrafts() {
  let drafts: any[] = [];
  const user = await getCurrentUser();
  const dbUser = user ? await db.user.findUnique({ where: { id: user.id }, include: { authorProfile: true } }) : null;
  const authorId = dbUser?.authorProfile?.id;
  const isAuthorOnly = user?.role === "AUTHOR";

  try {

    drafts = await db.article.findMany({
      where: isAuthorOnly 
        ? { status: { in: ["DRAFT", "REVISION_REQUESTED"] }, authorId: authorId || "none" } 
        : { status: { in: ["DRAFT", "REVISION_REQUESTED"] } },
      orderBy: { updatedAt: "desc" },
      include: { category: true, authorModel: true },
    });
  } catch (error) {
    console.error("AdminDrafts fetch error:", error);
  }

  return (
    <>
      <h1>{isAuthorOnly ? "My Drafts" : "All Drafts"}</h1>
      <p className="cs-sub">{drafts.length} drafts and revisions in progress.</p>
      
      <div style={{ marginBottom: "16px" }}>
        <Link href="/admin/editor" className="btn-cs primary">+ New story</Link>
      </div>

      <StoryDataTable articles={drafts} showStatusBadge={true} userRole={user?.role} emptyMessage="No drafts in progress." />
    </>
  );
}
