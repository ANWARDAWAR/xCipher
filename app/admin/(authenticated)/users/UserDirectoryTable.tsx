"use client";

import React, { useState } from "react";
import { Role } from "@prisma/client";
import { 
  ShieldCheck, 
  Shield, 
  UserCheck, 
  CheckSquare, 
  PenTool, 
  Lock, 
  Trash2, 
  Save, 
  Loader2, 
  Clock, 
  ExternalLink,
  Mail
} from "lucide-react";
import { updateUserRole, deleteUser } from "@/app/actions/users";
import { revokeInvitation } from "@/app/actions/invitations";
import { showToast } from "@/lib/utils";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Link from "next/link";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
  isActive: boolean;
  authorProfile?: {
    id: string;
    name: string;
    avatar: string | null;
    slug: string;
  } | null;
}

interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  expires: Date | string;
  createdAt: Date | string;
}

interface UserDirectoryTableProps {
  users: UserProfile[];
  currentUser: {
    id: string;
    email?: string | null;
    role: Role;
  };
  pendingInvitations: PendingInvite[];
}

function RoleBadge({ role }: { role: Role }) {
  switch (role) {
    case "OWNER":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wider uppercase bg-accent/10 text-accent border border-accent/20">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          Owner
        </span>
      );
    case "ADMIN":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          Admin
        </span>
      );
    case "EDITOR":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          Editor
        </span>
      );
    case "REVIEWER":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <CheckSquare className="w-3.5 h-3.5 shrink-0" />
          Reviewer
        </span>
      );
    case "AUTHOR":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium uppercase bg-muted/10 text-muted border border-muted/25">
          <PenTool className="w-3.5 h-3.5 shrink-0" />
          {role}
        </span>
      );
  }
}

function UserAvatar({ user }: { user: UserProfile }) {
  const [imgError, setImgError] = useState(false);
  const avatarUrl = user.image || user.authorProfile?.avatar;

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.trim()) {
      return email.slice(0, 2).toUpperCase();
    }
    return "XC";
  };

  const initials = getInitials(user.name || user.authorProfile?.name, user.email);

  if (avatarUrl && !imgError) {
    return (
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl}
          alt={user.name || user.email || "User Avatar"}
          className="w-10 h-10 shrink-0 aspect-square rounded-full object-cover border border-line ring-1 ring-black/5 dark:ring-white/10"
          onError={() => setImgError(true)}
        />
        {user.authorProfile && (
          <span
            title="Author Profile Linked"
            className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-surface flex items-center justify-center text-[8px] text-white font-bold"
          >
            ✓
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <div className="w-10 h-10 shrink-0 aspect-square rounded-full bg-surface-2 border border-line flex items-center justify-center font-bold text-xs text-ink select-none shadow-2xs">
        {initials}
      </div>
      {user.authorProfile && (
        <span
          title="Author Profile Linked"
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-surface flex items-center justify-center text-[8px] text-white font-bold"
        >
          ✓
        </span>
      )}
    </div>
  );
}

export default function UserDirectoryTable({
  users: initialUsers,
  currentUser,
  pendingInvitations: initialInvites,
}: UserDirectoryTableProps) {
  const [users, setUsers] = useState<UserProfile[]>(initialUsers);
  const [invites, setInvites] = useState<PendingInvite[]>(initialInvites);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, Role>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);
  const [referenceTime] = useState(() => Date.now());

  const canActorManage = (targetUser: UserProfile) => {
    if (targetUser.id === currentUser.id) return false;
    if (currentUser.role === "OWNER") return true;
    return false;
  };

  const handleRoleChange = (userId: string, newRole: Role) => {
    setSelectedRoles((prev) => ({ ...prev, [userId]: newRole }));
  };

  const handleSaveRole = async (user: UserProfile) => {
    const newRole = selectedRoles[user.id] || user.role;
    if (newRole === user.role) return;

    setSavingUserId(user.id);
    try {
      const res = await updateUserRole(user.id, newRole);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
        );
        setSelectedRoles((prev) => {
          const updated = { ...prev };
          delete updated[user.id];
          return updated;
        });
        showToast(`Role updated to ${newRole} for ${user.email || user.name}`);
      } else {
        showToast(`Error: ${res.error || "Failed to update role"}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update role";
      showToast(`Error: ${msg}`);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    const userId = deletingUser.id;
    try {
      const res = await deleteUser(userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        showToast(`Revoked system access for ${deletingUser.email || deletingUser.name}`);
      } else {
        showToast(`Error: ${res.error || "Failed to revoke user"}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to revoke user";
      showToast(`Error: ${msg}`);
    } finally {
      setDeletingUser(null);
    }
  };

  const handleRevokeInvite = async (inviteId: string, email: string) => {
    setRevokingInviteId(inviteId);
    try {
      const res = await revokeInvitation(inviteId);
      if (res.success) {
        setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
        showToast(`Revoked invitation for ${email}`);
      } else {
        showToast(`Error: ${res.error || "Failed to revoke invitation"}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to revoke invitation";
      showToast(`Error: ${msg}`);
    } finally {
      setRevokingInviteId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Active Team Members Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
              Active Team Members
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {users.length}
            </span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[640px] admin-table">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-xs font-semibold tracking-wider text-muted uppercase font-[var(--f-ui)]">
                  <th className="px-5 py-3.5 w-[42%]">Team Member</th>
                  <th className="px-5 py-3.5 w-[23%]">Role</th>
                  <th className="px-5 py-3.5 w-[35%] text-right">Access & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-sm text-muted">
                      No active users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isManageable = canActorManage(user);
                    const isSelf = user.id === currentUser.id;
                    const isOwner = user.role === "OWNER";
                    const currentSelectedRole = selectedRoles[user.id] || user.role;
                    const hasChangedRole = currentSelectedRole !== user.role;
                    const isSaving = savingUserId === user.id;

                    return (
                      <tr
                        key={user.id}
                        className="hover:bg-surface-2/40 transition-colors duration-150"
                      >
                        {/* Member Column */}
                        <td className="px-5 py-4" data-label="Member">
                          <div className="flex items-center gap-3.5">
                            <UserAvatar user={user} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-ink text-sm truncate">
                                  {user.name || user.authorProfile?.name || "Editorial Contributor"}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-muted font-mono truncate">
                                  {user.email || "No email assigned"}
                                </span>
                                {user.authorProfile && (
                                  <Link
                                    href={`/author/${user.authorProfile.slug}`}
                                    target="_blank"
                                    className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted hover:text-ink transition-colors"
                                    title="View Public Author Profile"
                                  >
                                    <ExternalLink className="w-2.5 h-2.5" />
                                    <span>Profile</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="px-5 py-4" data-label="Role">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Actions Column */}
                        <td className="px-5 py-4 text-right" data-label="Access & Actions">
                          {isManageable ? (
                            <div className="inline-flex items-center gap-2">
                              {/* Role Selector */}
                              <select
                                value={currentSelectedRole}
                                onChange={(e) =>
                                  handleRoleChange(user.id, e.target.value as Role)
                                }
                                disabled={isSaving}
                                className="h-8 text-xs font-medium rounded-lg border border-line bg-surface text-ink px-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23838D99%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:9px_9px] bg-[right_10px_center] bg-no-repeat"
                              >
                                <option value="AUTHOR">Author</option>
                                <option value="REVIEWER">Reviewer</option>
                                <option value="EDITOR">Editor</option>
                                <option value="ADMIN">Admin</option>
                                {currentUser.role === "OWNER" && (
                                  <option value="OWNER">Owner</option>
                                )}
                              </select>

                              {/* Save Role Button */}
                              <button
                                type="button"
                                onClick={() => handleSaveRole(user)}
                                disabled={!hasChangedRole || isSaving}
                                className={`inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg transition-all ${
                                  hasChangedRole
                                    ? "bg-accent hover:bg-accent-deep text-white shadow-2xs"
                                    : "bg-surface-2 text-faint border border-line cursor-not-allowed opacity-60"
                                }`}
                                title={hasChangedRole ? "Save role change" : "No changes made"}
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>Save</span>
                              </button>

                              {/* Revoke User Button */}
                              <button
                                type="button"
                                onClick={() => setDeletingUser(user)}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 h-8 px-2.5 text-xs font-medium rounded-lg border border-bad/20 text-bad hover:bg-bad/10 transition-colors"
                                title="Revoke system access"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Revoke</span>
                              </button>
                            </div>
                          ) : isOwner ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs font-medium text-muted">
                              <Lock className="w-3.5 h-3.5 text-bad shrink-0" />
                              Protected System Account
                            </span>
                          ) : isSelf ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs font-medium text-muted">
                              <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              Current Session
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 border border-line text-xs font-medium text-muted">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              Managed by Owner
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pending Invitations Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted font-[var(--f-ui)]">
              Pending Invitations
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {invites.length}
            </span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl shadow-xs overflow-hidden">
          {invites.length === 0 ? (
            <div className="p-8 text-center">
              <Clock className="w-8 h-8 text-muted/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-ink">No pending invitations</p>
              <p className="text-xs text-muted mt-0.5">
                New team member invite tokens will appear here until accepted.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px] admin-table">
                <thead>
                  <tr className="border-b border-line bg-surface-2/60 text-xs font-semibold tracking-wider text-muted uppercase font-[var(--f-ui)]">
                    <th className="px-5 py-3.5 w-[42%]">Recipient Email</th>
                    <th className="px-5 py-3.5 w-[23%]">Assigned Role</th>
                    <th className="px-5 py-3.5 w-[20%]">Expiration</th>
                    <th className="px-5 py-3.5 w-[15%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invites.map((inv) => {
                    const isRevoking = revokingInviteId === inv.id;
                    const expiresDate = new Date(inv.expires);
                    const isExpired = expiresDate.getTime() < referenceTime;

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-surface-2/40 transition-colors duration-150"
                      >
                        <td className="px-5 py-3.5" data-label="Recipient Email">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center text-muted shrink-0">
                              <Mail className="w-4 h-4" />
                            </div>
                            <span className="text-sm font-medium text-ink font-mono">
                              {inv.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5" data-label="Assigned Role">
                          <RoleBadge role={inv.role} />
                        </td>
                        <td className="px-5 py-3.5" data-label="Expiration">
                          <span
                            className={`text-xs ${
                              isExpired ? "text-bad font-semibold" : "text-muted"
                            }`}
                          >
                            {isExpired
                              ? "Expired"
                              : `Expires ${expiresDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}`}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right" data-label="Actions">
                          <button
                            type="button"
                            onClick={() => handleRevokeInvite(inv.id, inv.email)}
                            disabled={isRevoking}
                            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-medium rounded-lg border border-bad/20 text-bad hover:bg-bad/10 transition-colors"
                          >
                            {isRevoking ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            <span>Revoke</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Revoking a User */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        title="Revoke User Access"
        description={`Are you sure you want to permanently revoke system access for ${
          deletingUser?.name || deletingUser?.email || "this user"
        }? Their credentials will be deleted and any active sessions will be terminated immediately.`}
        confirmText="Revoke Access"
        cancelText="Keep User"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}
