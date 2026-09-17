import { Role } from "@prisma/client";
import { authorize } from "./capabilities";

// ──────────────────────────────────────────────────────────────────────────────
// Role hierarchy — retained ONLY for user management rank comparisons.
// Do NOT use this for any other authorization check.
// ──────────────────────────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 100,
  ADMIN: 90,
  EDITOR: 80,
  MODERATOR: 70,
  REVIEWER: 60,
  AUTHOR: 50,
  STAFF: 10,
};

export type ActionPolicy = {
  success: true;
} | {
  success: false;
  error: string;
};

// Base permission check — retained for backward compatibility
export function hasRequiredRole(userRole: Role, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

// ──────────────────────────────────────────────────────────────────────────────
// User Management Policies (rank-gated — the only legitimate use of hierarchy)
// ──────────────────────────────────────────────────────────────────────────────

export function canManageUser(actorRole: Role, targetRole: Role): ActionPolicy {
  if (actorRole === "OWNER") return { success: true };
  if (actorRole === "ADMIN") {
    if (targetRole === "OWNER") {
      return { success: false, error: "Administrators cannot manage Owner accounts." };
    }
    return { success: true };
  }
  return { success: false, error: "Insufficient permissions to manage users." };
}

export function canAssignRole(actorRole: Role, newRole: Role): ActionPolicy {
  if (actorRole === "OWNER") return { success: true };
  if (actorRole === "ADMIN") {
    if (newRole === "OWNER") {
      return { success: false, error: "Administrators cannot assign the Owner role." };
    }
    return { success: true };
  }
  return { success: false, error: "Insufficient permissions to assign roles." };
}

// ──────────────────────────────────────────────────────────────────────────────
// Article Policies — now delegate to the capability map
// ──────────────────────────────────────────────────────────────────────────────

export function canEditArticle(
  user: { id: string; role: string; authorId?: string | null }, 
  article?: { id: string; authorId?: string | null }
): ActionPolicy {
  const role = user.role as Role;
  
  // Full editorial access
  if (authorize(role, "article.edit.any")) {
    return { success: true };
  }
  
  // Own-article access
  if (authorize(role, "article.edit.own")) {
    // New article — allowed
    if (!article) return { success: true };
    
    // Check ownership
    if (user.authorId && article.authorId === user.authorId) {
      return { success: true };
    }
    return { success: false, error: "You can only edit your own articles." };
  }
  
  return { success: false, error: "Your role does not permit editing articles." };
}

export function canPublishArticle(userRole: Role): ActionPolicy {
  if (authorize(userRole, "article.publish")) {
    return { success: true };
  }
  return { success: false, error: "Your role does not permit publishing articles." };
}

export function canDeleteArticle(userRole: Role): ActionPolicy {
  if (authorize(userRole, "article.delete")) {
    return { success: true };
  }
  return { success: false, error: "Your role does not permit deleting articles." };
}

// ──────────────────────────────────────────────────────────────────────────────
// UI Visibility Policies — all delegate to authorize()
// ──────────────────────────────────────────────────────────────────────────────

export function canViewAdminPanel(userRole: Role): boolean {
  return authorize(userRole, "console.access");
}

export function canViewUsersList(userRole: Role): boolean {
  return authorize(userRole, "user.view");
}

export function canViewSettings(userRole: Role): boolean {
  // Everyone can view their own settings (settings.personal is universal)
  return authorize(userRole, "settings.personal");
}

export function canViewAuditLogs(userRole: Role): boolean {
  return authorize(userRole, "audit.view");
}

export function canViewReviewQueue(userRole: Role): boolean {
  return authorize(userRole, "article.review");
}

export function canModerateComments(userRole: Role): boolean {
  return authorize(userRole, "comment.moderate");
}

export function canViewSubscribers(userRole: Role): boolean {
  return authorize(userRole, "subscriber.view");
}

/**
 * Taxonomy page access — OWNER, ADMIN, EDITOR only.
 * This was previously gated by canReview, which incorrectly admitted REVIEWER
 * (who was then redirected by the page guard — a guaranteed dead link).
 */
export function canViewTaxonomy(userRole: Role): boolean {
  return authorize(userRole, "taxonomy.create");
}
