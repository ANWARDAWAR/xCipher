"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
    const [items, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: MAX_ITEMS,
        select: {
          id: true,
          message: true,
          link: true,
          isRead: true,
          createdAt: true,
        },
      }),
      db.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);

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
    await db.notification.updateMany({
      where: { id, userId: user.id },
      data: { isRead: true },
    });
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
    await db.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/admin", "layout");
    return { ok: true };
  } catch (error) {
    console.error("[notifications] mark all read failed:", error);
    return { ok: false };
  }
}
