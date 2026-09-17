import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SignOutButton from "@/components/editorial/SignOutButton";
import AdminNavLinks from "@/components/editorial/AdminNavLinks";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { authorProfile: true },
  });

  const displayName = dbUser?.authorProfile?.name || dbUser?.name || user.name || "User";
  const avatarUrl = dbUser?.authorProfile?.avatar || dbUser?.image || null;
  const headline = dbUser?.authorProfile?.headline || null;
  const initial = displayName.charAt(0).toUpperCase();
  const userRole = (dbUser?.role || user.role || "AUTHOR").toUpperCase();
  const authorSlug = dbUser?.authorProfile?.slug || null;

  return (
    <div className="console open" id="console" role="dialog" aria-modal="true" aria-label="xCipher editorial console" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div className="cs-top">
        <svg width="21" height="21" viewBox="0 0 26 26" aria-hidden="true" style={{ color: "#fff" }}>
          <rect x="1" y="1" width="10" height="10" fill="currentColor" />
          <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
          <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
          <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
        <span className="wm">x<span className="wm-x">Cipher</span></span>
        <span className="cs-tag">xCipher Editorial Console</span>
        <span className="spacer"></span>
        <SignOutButton />
        <Link className="btn-cs" href="/" target="_blank">View site</Link>
      </div>
      <div className="cs-body">
        <nav className="cs-nav" aria-label="Console sections">

          {/* ── Profile Card ─────────────────────── */}
          <Link
            href="/admin/settings"
            className="cs-profile-card"
            title="Edit profile"
          >
            {/* Avatar */}
            <div className="cs-profile-avatar">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="cs-profile-img"
                />
              ) : (
                <div className="cs-profile-initials">
                  {initial}
                </div>
              )}
              <div className="cs-profile-edit-overlay">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
            </div>

            {/* Name + role */}
            <div className="cs-profile-name" title={displayName}>{displayName}</div>
            {headline && (
              <div className="cs-profile-headline" title={headline}>{headline}</div>
            )}
            <div className="cs-profile-role-badge">{userRole}</div>

            {authorSlug && (
              <span className="cs-profile-view-link">View public profile →</span>
            )}
          </Link>

          <div className="cs-nav-divider" />

          <AdminNavLinks />
        </nav>
        <div className="cs-main" id="csMain">
          {children}
        </div>
      </div>
    </div>
  );
}
