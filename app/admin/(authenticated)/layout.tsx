import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import SignOutButton from "@/components/editorial/SignOutButton";
import AdminNavLinks from "@/components/editorial/AdminNavLinks";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/console/NotificationBell";
import ConsoleNavDrawer from "@/components/console/ConsoleNavDrawer";
import { getNotifications } from "@/app/actions/notifications";
import { canViewReviewQueue, canViewUsersList, canViewAuditLogs, canModerateComments, canViewSubscribers, canViewTaxonomy } from "@/lib/permissions";
import { authorize } from "@/lib/capabilities";
import { Role } from "@prisma/client";
import Logo from "@/components/common/Logo";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login");
  }

  // Being signed in is not the same as being allowed into the console.
  // STAFF deliberately has no `console.access` capability -- they are
  // public-site-only accounts (lib/capabilities.ts) -- but nothing was
  // enforcing that, so a STAFF session reached the console shell and every
  // child route that only checks a narrower permission. This is the gate the
  // capability was written for.
  if (!authorize(user.role as Role, "console.access")) {
    redirect("/");
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

  let pendingCommentsCount = 0;
  if (canModerateComments(userRole as Role)) {
    pendingCommentsCount = await db.comment.count({
      where: { status: "PENDING" }
    });
  }

  const { items: notifications, unreadCount } = await getNotifications();

  // The wrapper below was role="dialog" aria-modal="true". That is a factual
  // misdescription: this is the whole console, not a modal over something
  // else. aria-modal tells assistive tech that everything outside this node is
  // inert, so a screen reader hides the rest of the document -- and it implies
  // an escape route back to an underlying page that does not exist here.
  // Removing it lets the landmarks (nav, main) be reached normally.
  return (
    <div className="console open" id="console" aria-label="xSypher editorial console" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <a href="#csMain" className="skip-link">
        Skip to content
      </a>
      <div className="cs-top">
        <Link href="/admin" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Logo variant="brand" className="text-[19px]" />
        </Link>
        <span className="cs-tag hidden sm:inline-flex">Editorial Console</span>
        <span className="spacer"></span>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationBell items={notifications} unreadCount={unreadCount} />
          <ThemeToggle />
          <a 
            className="btn-cs" 
            href={process.env.NEXT_PUBLIC_SITE_URL || "https://www.xsypher.com"} 
            target="_blank" 
            rel="noopener noreferrer"
            title="Open public website in a new tab"
          >
            <span className="hidden sm:inline">View site</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
          <SignOutButton />
        </div>
      </div>
      <div className="cs-body">
        <ConsoleNavDrawer>
        <nav className="cs-nav h-full" aria-label="Console sections">

          {/* ── Profile Card ─────────────────────── */}
          <Link
            href="/admin/settings"
            className="cs-profile-card group"
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
            </div>

            {/* Name + role */}
            <div className="cs-profile-info">
              <div className="cs-profile-name group-hover:text-[var(--accent)] transition-colors" title={displayName}>{displayName}</div>
              <div className="text-[10px] text-[var(--muted)] font-mono uppercase tracking-wider mt-0.5 truncate">{userRole}</div>
            </div>
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
            canManageAuthors={authorize(userRole as Role, "author.manage.all")}
            reviewCount={reviewCount}
            pendingCommentsCount={pendingCommentsCount}
          />
        </nav>
        </ConsoleNavDrawer>
        {/*
          Was a plain <div>. The console's only landmark was the <nav>, so a
          screen-reader user had no way to jump to the actual page content --
          and the skip link above needs a focusable target to land on.
        */}
        <main className="cs-main" id="csMain" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
