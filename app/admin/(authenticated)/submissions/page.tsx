import { redirect } from "next/navigation";

// ──────────────────────────────────────────────────────────────────────────────
// /admin/submissions → permanent redirect to the unified article index
// with status preset to SUBMITTED (the review queue)
// ──────────────────────────────────────────────────────────────────────────────

export default function AdminSubmissions() {
  redirect("/admin/review");
}
