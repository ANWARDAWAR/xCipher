import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SignOutButton from "@/components/editorial/SignOutButton";
import AdminNavLinks from "@/components/editorial/AdminNavLinks";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/console/NotificationBell";
import { getNotifications } from "@/app/actions/notifications";
import { canViewReviewQueue, canViewUsersList, canViewAuditLogs, canModerateComments, canViewSubscribers, canViewTaxonomy } from "@/lib/permissions";
import { Role } from "@prisma/client";

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

  let reviewCount = 0;
  if (canViewReviewQueue(userRole as Role)) {
    reviewCount = await db.article.count({
      where: { status: "SUBMITTED" }
    });
  }

  const { items: notifications, unreadCount } = await getNotifications();

  return (
    <div className="console open" id="console" role="dialog" aria-modal="true" aria-label="xCipher editorial console" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div className="cs-top">
        <Link href="/admin" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <svg width="22" height="22" viewBox="0 0 26 26" aria-hidden="true" style={{ color: "var(--ink)" }}>
            <rect x="1" y="1" width="10" height="10" fill="currentColor" />
            <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".35" />
            <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".35" />
            <path d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9" stroke="var(--accent)" strokeWidth="3.2" strokeLinecap="round" />
          </svg>
          <span className="wm">x<span className="wm-x">Cipher</span></span>
        </Link>
        <span className="cs-tag">Editorial Console</span>
        <span className="spacer"></span>
        <div className="flex items-center gap-2">
          <NotificationBell items={notifications} unreadCount={unreadCount} />
          <ThemeToggle />
          <Link 
            className="btn-cs" 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            title="Open public website in a new tab"
          >
            <span>View site</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
          <SignOutButton />
        </div>
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

          <AdminNavLinks 
            userRole={userRole as Role}
            canReview={canViewReviewQueue(userRole as Role)}
            canManageUsers={canViewUsersList(userRole as Role)}
            canViewLogs={canViewAuditLogs(userRole as Role)}
            canModerateComments={canModerateComments(userRole as Role)}
            canViewSubscribers={canViewSubscribers(userRole as Role)}
            canViewTaxonomy={canViewTaxonomy(userRole as Role)}
            reviewCount={reviewCount}
          />
        </nav>
        <div className="cs-main" id="csMain">
          {children}
        </div>
      </div>
    </div>
  );
}
