export const runtime = 'edge';
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { invitation as invitationTable } from "@/lib/db/schema";
import { canViewUsersList } from "@/lib/permissions";
import { UserPlus, ShieldAlert } from "lucide-react";
import UserDirectoryTable from "./UserDirectoryTable";
import SyncAuthorsButton from "./SyncAuthorsButton";
import { Role } from "@/lib/types";

export const metadata = {
  title: "User Management | xSypher",
};

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/admin/login");
  }

  const isAuthorized = canViewUsersList(currentUser.role as Role);

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-surface border border-line rounded-xl shadow-xs text-center">
        <div className="w-12 h-12 rounded-full bg-bad/10 text-bad flex items-center justify-center mx-auto mb-4 border border-bad/20">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-2 font-[var(--f-ui)]">
          Permission Required
        </h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Only <strong className="text-ink">OWNER</strong> and <strong className="text-ink">ADMIN</strong> roles can access user management.<br />
          You are currently signed in as <strong className="text-ink">{currentUser.email}</strong> with role{" "}
          <span className="uppercase px-2 py-0.5 bg-surface-2 rounded-md border border-line text-xs font-semibold text-ink">
            {currentUser.role}
          </span>.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium rounded-lg border border-line bg-surface hover:bg-surface-2 text-ink transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/api/auth/signout"
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-accent hover:bg-accent-deep text-white transition-colors"
          >
            Switch Account
          </Link>
        </div>
      </div>
    );
  }

  const [users, pendingInvitations] = await Promise.all([
    db.query.user.findMany({
      with: {
        authorProfile: {
          columns: {
            id: true,
            name: true,
            avatar: true,
            slug: true,
          },
        },
      },
      orderBy: (u, { asc }) => [asc(u.email)],
    }),
    db.query.invitation.findMany({
      where: eq(invitationTable.status, "PENDING"),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    }),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
              User Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {users.length} {users.length === 1 ? "member" : "members"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1 font-[var(--f-ui)]">
            Manage system access, editorial roles, and team permissions.
          </p>
        </div>

        <div className="flex gap-2">
          <SyncAuthorsButton />
          <Link
            href="/admin/users/invite"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-deep active:bg-accent-press text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs hover:shadow transition-all duration-150 active:scale-[0.99] self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-white">+ Invite User</span>
          </Link>
        </div>
      </div>

      {/* Directory Content */}
      <UserDirectoryTable
        users={users}
        currentUser={{
          id: currentUser.id,
          email: currentUser.email,
          role: currentUser.role as Role,
        }}
        pendingInvitations={pendingInvitations}
      />
    </div>
  );
}
