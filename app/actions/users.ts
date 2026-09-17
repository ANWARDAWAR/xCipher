"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const admin = await requireRole(["OWNER", "ADMIN"]);
    
    // Prevent changing owner's role
    const userToUpdate = await db.user.findUnique({ where: { id: userId } });
    if (userToUpdate?.role === "OWNER" && admin.id !== userId) {
      return { success: false, error: "Cannot change the role of the Owner." };
    }

    await db.user.update({
      where: { id: userId },
      data: { role: newRole }
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
    console.error("Error updating user role:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    const admin = await requireRole(["OWNER", "ADMIN"]);

    const userToDelete = await db.user.findUnique({ where: { id: userId } });
    if (userToDelete?.role === "OWNER") {
      return { success: false, error: "Cannot delete the Owner." };
    }

    if (admin.id === userId) {
      return { success: false, error: "Cannot delete yourself." };
    }

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
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}
