import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminSubmissions() {
  const user = await getCurrentUser();
  const allowedRoles = ["OWNER", "ADMIN", "EDITOR", "REVIEWER"];
  
  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="cs-card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          backgroundColor: "var(--accent-soft)",
          color: "var(--accent)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem"
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--f-display)", fontSize: "1.35rem", marginBottom: "0.5rem" }}>
          Permission Required
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", fontFamily: "var(--f-ui)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Only <strong>Owners, Admins, Editors, and Reviewers</strong> can access the Review Queue.<br />
          You are currently signed in as <strong style={{ color: "var(--ink)" }}>{user?.email}</strong> with role <span style={{ textTransform: "uppercase", padding: "2px 6px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", fontSize: "11px", fontWeight: "bold" }}>{user?.role}</span>.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/admin" className="btn-cs">
            Return to Dashboard
          </Link>
          <Link href="/api/auth/signout" className="btn-cs primary">
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  let submissions: any[] = [];
  try {
    submissions = await db.article.findMany({
      where: { status: { in: ["SUBMITTED", "REVIEW", "REVISION_REQUESTED"] } },
      orderBy: { updatedAt: "desc" },
      include: { category: true, authorModel: true },
    });
  } catch (error) {
    console.error("AdminSubmissions fetch error:", error);
  }

  return (
    <>
      <h1>Review Queue</h1>
      <p className="cs-sub">{submissions.length} articles waiting for review.</p>
      
      <div className="cs-card">
        {submissions.length > 0 ? (
          submissions.map(s => (
            <div className="cs-row" key={s.id}>
              <span className="t">{s.title || "Untitled story"}</span>
              <span className="m">{s.category?.name || "None"}</span>
              <span className="m">{s.status}</span>
              <span className="m">{s.authorModel?.name || s.author || "Unknown Author"}</span>
              <Link href={`/admin/editor/${s.id}`} className="act">Review</Link>
            </div>
          ))
        ) : (
          <p className="cs-sub" style={{ margin: 0 }}>Queue is empty.</p>
        )}
      </div>
    </>
  );
}
