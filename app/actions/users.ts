"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageUser, canAssignRole } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { handleServerError } from "@/lib/errors";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return { success: false, error: "Unauthenticated" };
    
    const assignPolicy = canAssignRole(admin.role as Role, newRole);
    if (!assignPolicy.success) return assignPolicy;

    const userToUpdate = await db.user.findUnique({ where: { id: userId } });
    if (!userToUpdate) return { success: false, error: "User not found" };

    if (admin.id !== userId) {
      const managePolicy = canManageUser(admin.role as Role, userToUpdate.role as Role);
      if (!managePolicy.success) return managePolicy;
    }

    await db.user.update({
      where: { id: userId },
      data: { 
        role: newRole,
        sessionVersion: { increment: 1 } 
      }
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "UPDATE_USER_ROLE",
        entityType: "User",
        entityId: userId,
        details: { newRole }
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return handleServerError(error, "Failed to update user role");
  }
}

export async function deleteUser(userId: string) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return { success: false, error: "Unauthenticated" };

    if (admin.id === userId) {
      return { success: false, error: "Cannot delete yourself." };
    }

    const userToDelete = await db.user.findUnique({ where: { id: userId } });
    if (!userToDelete) return { success: false, error: "User not found" };

    const managePolicy = canManageUser(admin.role as Role, userToDelete.role as Role);
    if (!managePolicy.success) return managePolicy;

    await db.user.delete({
      where: { id: userId }
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "DELETE_USER",
        entityType: "User",
        entityId: userId,
      }
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return handleServerError(error, "Failed to delete user");
  }
}
