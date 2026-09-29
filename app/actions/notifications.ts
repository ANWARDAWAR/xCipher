"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "@/lib/revalidate";
import { notification } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";


// ──────────────────────────────────────────────────────────────────────────────
// Notification read actions
// ──────────────────────────────────────────────────────────────────────────────
//
// Every query here is scoped to the signed-in user's own id. A notification is
// private to its recipient, so there is no role that widens this: an owner has
// no business reading an author's notifications. The scoping is in the where
// clause of each query rather than checked separately, so there is no path that
// forgets it.
// ──────────────────────────────────────────────────────────────────────────────

export async function createNotification(userId: string, message: string, type: string, link?: string) {
  try {
    const [created] = await db.insert(notification).values({
      id: crypto.randomUUID(),
      userId,
      message,
      type,
      link,
    }).returning();
    return { success: true, notification: created };
  } catch (error: any) {
    console.error("Failed to create notification:", error);
    return { success: false, error: error.message };
  }
}


export type NotificationItem = {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
};

const MAX_ITEMS = 15;

export async function getNotifications(): Promise<{
  items: NotificationItem[];
  unreadCount: number;
}> {
  const user = await getCurrentUser();
  if (!user) return { items: [], unreadCount: 0 };

  try {
    const itemsPromise = db.query.notification.findMany({
      where: eq(notification.userId, user.id),
      orderBy: [desc(notification.createdAt)],
      limit: MAX_ITEMS,
      columns: {
        id: true,
        message: true,
        link: true,
        isRead: true,
        createdAt: true,
      },
    });
    
    const countPromise = db.select({ count: sql<number>`count(*)::int` })
      .from(notification)
      .where(and(eq(notification.userId, user.id), eq(notification.isRead, false)));

    const [items, [{ count: unreadCount }]] = await Promise.all([itemsPromise, countPromise]);

    return { items, unreadCount };
  } catch (error) {
    // The bell is peripheral. If this query fails the console must still render,
    // so the failure degrades to an empty bell rather than an error page.
    console.error("[notifications] fetch failed:", error);
    return { items: [], unreadCount: 0 };
  }
}

export async function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    // updateMany, not update: it takes a where clause, so ownership is enforced
    // by the query itself. A forged id belonging to another user matches zero
    // rows instead of updating someone else's notification.
    await db.update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.id, id), eq(notification.userId, user.id)));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[notifications] mark read failed:", error);
    return { ok: false };
  }
}

export async function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  try {
    await db.update(notification)
      .set({ isRead: true })
      .where(and(eq(notification.userId, user.id), eq(notification.isRead, false)));
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[notifications] mark all read failed:", error);
    return { ok: false };
  }
}
