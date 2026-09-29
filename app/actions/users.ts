"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { canManageUser, canAssignRole } from "@/lib/permissions";
import { revalidatePath } from "@/lib/revalidate";
import { handleServerError } from "@/lib/errors";
import { eq, sql, and, isNull } from "drizzle-orm";
import { user, auditLog, author as authorTable } from "@/lib/db/schema";

import { Role } from "@/lib/types";

export async function updateUserRole(userId: string, newRole: Role) {
  try {
    const admin = await getCurrentUser();
    if (!admin) return { success: false, error: "Unauthenticated" };
    
    const assignPolicy = canAssignRole(admin.role as Role, newRole);
    if (!assignPolicy.success) return assignPolicy;

    const [userToUpdate] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!userToUpdate) return { success: false, error: "User not found" };

    if (admin.id !== userId) {
      const managePolicy = canManageUser(admin.role as Role, userToUpdate.role as Role);
      if (!managePolicy.success) return managePolicy;
    }

    let currentAuthorId = userToUpdate.authorId;

    if (!currentAuthorId) {
      let existingAuthor;
      if (userToUpdate.email) {
        const [found] = await db.select().from(authorTable).where(eq(authorTable.email, userToUpdate.email)).limit(1);
        existingAuthor = found;
      }
      
      if (!existingAuthor && userToUpdate.name) {
        const [authorByName] = await db.select()
          .from(authorTable)
          .leftJoin(user, eq(authorTable.id, user.authorId))
          .where(and(eq(authorTable.name, userToUpdate.name), isNull(user.id)))
          .limit(1);
        if (authorByName) existingAuthor = authorByName.Author;
      }

      if (existingAuthor) {
        currentAuthorId = existingAuthor.id;
      } else {
        const name = userToUpdate.name || (userToUpdate.email ? userToUpdate.email.split('@')[0] : `user-${crypto.randomUUID().slice(0, 5)}`);
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let counter = 1;
        while ((await db.select().from(authorTable).where(eq(authorTable.slug, slug)).limit(1)).length > 0) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }

        const [newAuthor] = await db.insert(authorTable).values({
          id: crypto.randomUUID(),
          slug,
          name,
          email: userToUpdate.email,
          role: newRole,
        }).returning();
        currentAuthorId = newAuthor.id;
      }
    } else {
      await db.update(authorTable).set({ role: newRole }).where(eq(authorTable.id, currentAuthorId));
    }

    await db.update(user).set({
      role: newRole,
      authorId: currentAuthorId,
      sessionVersion: sql`${user.sessionVersion} + 1`
    }).where(eq(user.id, userId));

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: admin.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: userId,
      details: { newRole }
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

    const [userToDelete] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
    if (!userToDelete) return { success: false, error: "User not found" };

    const managePolicy = canManageUser(admin.role as Role, userToDelete.role as Role);
    if (!managePolicy.success) return managePolicy;

    await db.delete(user).where(eq(user.id, userId));

    await db.insert(auditLog).values({
      id: crypto.randomUUID(),
      userId: admin.id,
      action: "DELETE_USER",
      entityType: "User",
      entityId: userId,
    });

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return handleServerError(error, "Failed to delete user");
  }
}
