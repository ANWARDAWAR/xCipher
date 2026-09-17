import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canModerateComments } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { getPendingComments } from "@/app/actions/comments";
import CommentsQueueClient from "./CommentsQueueClient";

export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (!canModerateComments(user.role as Role)) {
    redirect("/admin");
  }

  const result = await getPendingComments(1);
  const comments = (result.comments || []).map((c: any) => ({
    ...c,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  }));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
        <div>
          <h1>Comment Moderation</h1>
          <p className="cs-sub">Review and action pending reader comments before they appear publicly.</p>
        </div>
        {result.total !== undefined && (
          <div style={{ fontSize: "13px", color: "var(--ink-muted)", textAlign: "right" }}>
            {result.total} item{result.total !== 1 ? "s" : ""} in queue
            {result.pages && result.pages > 1 && ` · Page 1 of ${result.pages}`}
          </div>
        )}
      </div>
      <CommentsQueueClient initialComments={comments} />
    </>
  );
}
