import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { revokeInvitation } from "@/app/actions/invitations";
import { updateUserRole, deleteUser } from "@/app/actions/users";
import { Role } from "@prisma/client";

export const metadata = {
  title: "User Management | xCipher",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  const isAuthorized = ["OWNER", "ADMIN"].includes(currentUser.role);

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
          Only <strong>OWNER</strong> and <strong>ADMIN</strong> roles can access user management.<br />
          You are currently signed in as <strong style={{ color: "var(--ink)" }}>{currentUser.email}</strong> with role <span style={{ textTransform: "uppercase", padding: "2px 6px", background: "var(--surface-2)", borderRadius: "var(--r-sm)", border: "1px solid var(--line)", fontSize: "11px", fontWeight: "bold" }}>{currentUser.role}</span>.
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

  const users = await db.user.findMany({
    orderBy: { email: "asc" },
  });

  const pendingInvitations = await db.invitation.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>User Management</h1>
          <p className="cs-sub">Manage system access, roles, and editorial team members.</p>
        </div>
        <Link href="/admin/users/invite" className="btn-cs primary">
          Invite User
        </Link>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Active Team Members</h2>
      <div className="cs-card">
        {users.length > 0 ? (
          users.map((user) => (
            <div className="cs-row" key={user.id}>
              <span className="t">{user.name || "N/A"}</span>
              <span className="m">{user.email || "N/A"}</span>
              <span className="m">{user.role}</span>
              
              {currentUser.role === "OWNER" && user.id !== currentUser.id && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <form action={async (formData) => {
                    "use server";
                    const role = formData.get("role") as Role;
                    await updateUserRole(user.id, role);
                  }} style={{ display: "flex", gap: "4px" }}>
                    <select name="role" defaultValue={user.role} style={{ padding: "2px 6px", fontSize: "12px", background: "var(--surface)", color: "var(--ink)", border: "1px solid var(--line)", borderRadius: "var(--r-sm)" }}>
                      <option value="AUTHOR">AUTHOR</option>
                      <option value="REVIEWER">REVIEWER</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <button type="submit" className="act">Save</button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await deleteUser(user.id);
                  }}>
                    <button type="submit" className="act danger">Revoke</button>
                  </form>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="cs-sub" style={{ margin: 0 }}>No active users found.</p>
        )}
      </div>

      {pendingInvitations.length > 0 && (
        <>
          <h2 style={{ marginTop: '2rem' }}>Pending Invitations</h2>
          <div className="cs-card">
            {pendingInvitations.map((inv) => (
              <div className="cs-row" key={inv.id}>
                <span className="t">{inv.email}</span>
                <span className="m">{inv.role}</span>
                <span className="m">Expires: {new Date(inv.expires).toLocaleDateString()}</span>
                
                <form action={async () => {
                  "use server";
                  await revokeInvitation(inv.id);
                  revalidatePath("/admin/users");
                }}>
                  <button className="act danger">Revoke</button>
                </form>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
