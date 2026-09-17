import { Role } from "@prisma/client";

// Role numeric hierarchy (higher number = more privileges)
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

// Base permission check
export function hasRequiredRole(userRole: Role, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}

// User Management Policies
export function canManageUser(actorRole: Role, targetRole: Role): ActionPolicy {
  if (actorRole === "OWNER") return { success: true };
  if (actorRole === "ADMIN") {
    // Admins can manage anyone EXCEPT Owners
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
    // Admins cannot grant OWNER
    if (newRole === "OWNER") {
      return { success: false, error: "Administrators cannot assign the Owner role." };
    }
    return { success: true };
  }
  return { success: false, error: "Insufficient permissions to assign roles." };
}

// Article Policies
export function canEditArticle(
  user: { id: string; role: string; authorId?: string | null }, 
  article?: { id: string; authorId?: string | null }
): ActionPolicy {
  const role = user.role as Role;
  
  // High-level editorial roles have full edit access
  if (["OWNER", "ADMIN", "EDITOR"].includes(role)) {
    return { success: true };
  }
  
  // Authors can only edit their own articles
  if (role === "AUTHOR") {
    // If it's a new article, author can create it
    if (!article) return { success: true };
    
    // Check if the author matches
    if (user.authorId && article.authorId === user.authorId) {
      return { success: true };
    }
    return { success: false, error: "Authors can only edit their own articles." };
  }
  
  // Reviewers, Moderators, Staff cannot arbitrarily edit content
  return { success: false, error: "Role is not permitted to edit articles." };
}

export function canPublishArticle(userRole: Role): ActionPolicy {
  if (["OWNER", "ADMIN", "EDITOR"].includes(userRole)) {
    return { success: true };
  }
  return { success: false, error: "Role is not permitted to publish articles." };
}

export function canDeleteArticle(userRole: Role): ActionPolicy {
  if (["OWNER", "ADMIN", "EDITOR"].includes(userRole)) {
    return { success: true };
  }
  return { success: false, error: "Role is not permitted to delete articles." };
}

// UI Visibility Policies (Returns boolean for rendering logic)
export function canViewAdminPanel(userRole: Role): boolean {
  return hasRequiredRole(userRole, "STAFF");
}

export function canViewUsersList(userRole: Role): boolean {
  return hasRequiredRole(userRole, "ADMIN");
}

export function canViewSettings(userRole: Role): boolean {
  // Everyone can view their own settings
  return true; 
}

export function canViewAuditLogs(userRole: Role): boolean {
  return hasRequiredRole(userRole, "ADMIN");
}

export function canViewReviewQueue(userRole: Role): boolean {
  return ["OWNER", "ADMIN", "EDITOR", "REVIEWER"].includes(userRole);
}

export function canModerateComments(userRole: Role): boolean {
  return hasRequiredRole(userRole, "MODERATOR");
}

export function canViewSubscribers(userRole: Role): boolean {
  return hasRequiredRole(userRole, "ADMIN");
}
