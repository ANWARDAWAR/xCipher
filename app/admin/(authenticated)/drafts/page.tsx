import { redirect } from "next/navigation";

// ──────────────────────────────────────────────────────────────────────────────
// /admin/drafts → permanent redirect to the unified article index
// with status preset to DRAFT + REVISION_REQUESTED
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminDrafts() {
  redirect("/admin/articles?status=DRAFT,REVISION_REQUESTED");
}
