import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import InviteForm from "./InviteForm";

export const metadata = {
  title: "Invite User | xCipher",
};

export default async function InvitePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  const isAuthorized = ["OWNER", "ADMIN"].includes(user.role);

  if (!isAuthorized) {
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
          Only <strong>OWNER</strong> and <strong>ADMIN</strong> roles are permitted to invite team members.<br />
          You are currently signed in as <strong style={{ color: "var(--ink)" }}>{user.email}</strong> with role <span style={{ textTransform: "uppercase", padding: "2px 6px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", fontSize: "11px", fontWeight: "bold" }}>{user.role}</span>.
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/admin" className="btn-cs">
            Return to Dashboard
          </Link>
          <Link href="/api/auth/signout" className="btn-cs primary">
            Switch to Owner / Admin Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <header className="cs-header">
        <div>
          <h1 className="cs-title">Invite Team Member</h1>
          <p className="cs-deck">Send a secure invitation link to add a new user to the editorial console.</p>
        </div>
        <div className="cs-actions">
          <Link href="/admin/users" className="btn-cs">
            Back to Users
          </Link>
        </div>
      </header>

      <div className="cs-card" style={{ maxWidth: "600px", margin: "2rem 0" }}>
        <InviteForm />
      </div>
    </>
  );
}
