import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { user as userTable, article as articleTable, comment as commentTable } from "@/lib/db/schema";
import SignOutButton from "@/components/editorial/SignOutButton";
import AdminNavLinks from "@/components/editorial/AdminNavLinks";
import ThemeToggle from "@/components/layout/ThemeToggle";
import NotificationBell from "@/components/console/NotificationBell";
import AdminShell from "@/components/console/AdminShell";
import { getNotifications } from "@/app/actions/notifications";
import { canViewReviewQueue, canViewUsersList, canViewAuditLogs, canModerateComments, canViewSubscribers, canViewTaxonomy } from "@/lib/permissions";
import { authorize } from "@/lib/capabilities";
import Logo from "@/components/common/Logo";
import { Role } from "@/lib/types";

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

  const dbUser = await db.query.user.findFirst({
    where: eq(userTable.id, user.id),
    columns: { name: true, image: true, role: true },
    with: { authorProfile: { columns: { name: true, avatar: true } } },
  });

  const displayName = dbUser?.authorProfile?.name || dbUser?.name || user.name || "User";
  const avatarUrl = dbUser?.authorProfile?.avatar || dbUser?.image || null;
  const initial = displayName.charAt(0).toUpperCase();
  const userRole = (dbUser?.role || user.role || "AUTHOR").toUpperCase();

  let reviewCount = 0;
  if (canViewReviewQueue(userRole as Role)) {
    reviewCount = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(articleTable)
      .where(eq(articleTable.status, "SUBMITTED"))
      .then(res => res[0]?.count || 0);
  }

  let pendingCommentsCount = 0;
  if (canModerateComments(userRole as Role)) {
    pendingCommentsCount = await db.select({ count: sql`count(*)`.mapWith(Number) })
      .from(commentTable)
      .where(eq(commentTable.status, "PENDING"))
      .then(res => res[0]?.count || 0);
  }

  const { items: notifications, unreadCount } = await getNotifications();

  const actions = (
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
  );
  const sidebar = (
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
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  sizes="36px"
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
  );
  return (
    <AdminShell
      brand={<Link href="/admin" className="console-brand flex items-center gap-2.5 hover:opacity-90 transition-opacity"><Logo variant="brand" className="text-[19px]" /></Link>}
      actions={actions}
      sidebar={sidebar}
      avatar={avatarUrl ? <Image src={avatarUrl} alt="" width={32} height={32} sizes="32px" className="w-8 h-8 rounded-full object-cover" /> : <span className="console-avatar-initial">{initial}</span>}
      displayName={displayName}
      canCreate={authorize(userRole as Role, 'article.create')}
    >
      {children}
    </AdminShell>
  );
}
