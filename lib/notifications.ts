import { db } from "@/lib/db";
import { authorize, ROLE_CAPABILITIES } from "@/lib/capabilities";
import { sendNotificationEmail } from "@/lib/email";
import type { Role } from "@prisma/client";

// ──────────────────────────────────────────────────────────────────────────────
// Notification emitter
// ──────────────────────────────────────────────────────────────────────────────
//
// Every workflow transition calls one of these. They are deliberately
// fail-soft: a notification is a side effect of a transition, never a
// precondition for it. If the write fails the transition must still succeed,
// so errors are logged and swallowed rather than propagated.
//
// They are also called *outside* the transaction that performs the transition.
// A notification for a transition that then rolled back is worse than a missing
// one, but holding a transaction open for a non-essential insert is worse
// still, and the transitions commit before these run.
//
// Delivery is in-app first: rows land in the Notification table and the console
// reads them. Email is sent alongside -- never instead of -- that row, from
// inside emit(), so no call site knows or cares that it happens. The in-app
// notification is the record; the email is a nudge for someone who is not
// currently looking at the console.
// ──────────────────────────────────────────────────────────────────────────────

type NotifyInput = {
  userIds: string[];
  message: string;
  link?: string;
};

/** The shape stored in User.notificationPrefs. Every field is optional because
 *  the column is nullable and older rows predate it. */
type NotificationPrefs = {
  emailAlerts?: boolean;
  weeklyDigest?: boolean;
  reviewUpdates?: boolean;
};

/** Writes one notification per recipient, skipping duplicates and self-notifies. */
async function emit({ userIds, message, link }: NotifyInput): Promise<void> {
  const unique = [...new Set(userIds.filter(Boolean))];
  if (unique.length === 0) return;

  try {
    await db.notification.createMany({
      data: unique.map((userId) => ({ userId, message, link: link ?? null })),
    });
  } catch (error) {
    console.error("[notifications] emit failed:", error);
  }

  // Email is attempted only after the in-app row is written, and its failure is
  // swallowed the same way. The whole point of the fail-soft contract above is
  // that a transition never depends on a notification; adding a network call
  // must not quietly change that.
  await emailFanout(unique, message, link);
}

/** Sends the same message by email to recipients who have asked for it. */
async function emailFanout(
  userIds: string[],
  message: string,
  link?: string
): Promise<void> {
  // Cheap early exit so an unconfigured install does not query users on every
  // single transition just to discard the result.
  if (!process.env.RESEND_API_KEY) return;

  try {
    const recipients = await db.user.findMany({
      where: { id: { in: userIds }, isActive: true, email: { not: null } },
      select: { id: true, email: true, name: true, notificationPrefs: true },
    });

    const wanted = recipients.filter((u) => {
      const prefs = (u.notificationPrefs ?? {}) as NotificationPrefs;
      // Default ON when unset. The settings form has always shown emailAlerts
      // defaulting to true, so a user who never touched it expects mail; making
      // the absent case mean "off" would silently contradict the UI they saw.
      return prefs.emailAlerts !== false;
    });

    if (wanted.length === 0) return;

    // Concurrent rather than sequential: a submission notifies every reviewer,
    // and awaiting each send in turn would add the full round-trip per person
    // to the transition's response time. allSettled so one bad address cannot
    // stop the rest.
    await Promise.allSettled(
      wanted.map((u) =>
        sendNotificationEmail({
          to: u.email as string,
          recipientName: u.name,
          message,
          link: link ?? null,
        })
      )
    );
  } catch (error) {
    console.error("[notifications] email fanout failed:", error);
  }
}

/** Resolves the User account behind an Author profile, if one is linked. */
async function userIdForAuthor(authorId: string | null | undefined): Promise<string | null> {
  if (!authorId) return null;
  try {
    const user = await db.user.findFirst({
      where: { authorId },
      select: { id: true },
    });
    return user?.id ?? null;
  } catch (error) {
    console.error("[notifications] author lookup failed:", error);
    return null;
  }
}

/** Every active user whose role holds article.review. */
async function reviewerUserIds(): Promise<string[]> {
  const reviewerRoles = (Object.keys(ROLE_CAPABILITIES) as Role[]).filter((role) =>
    authorize(role, "article.review")
  );
  try {
    const users = await db.user.findMany({
      where: { isActive: true, role: { in: reviewerRoles } },
      select: { id: true },
    });
    return users.map((u) => u.id);
  } catch (error) {
    console.error("[notifications] reviewer lookup failed:", error);
    return [];
  }
}

type ArticleRef = {
  id: string;
  title: string | null;
  authorId?: string | null;
};

const reviewLink = (id: string) => `/admin/review/${id}`;
const editorLink = (id: string) => `/admin/editor/${id}`;
const titleOf = (article: ArticleRef) => article.title?.trim() || "Untitled";

/** An author submitted an article. Tell everyone who can review it. */
export async function notifySubmitted(article: ArticleRef, actorId: string): Promise<void> {
  const reviewers = (await reviewerUserIds()).filter((id) => id !== actorId);
  await emit({
    userIds: reviewers,
    message: `"${titleOf(article)}" was submitted for review.`,
    link: reviewLink(article.id),
  });
}

/** A reviewer approved an article. Tell the author. */
export async function notifyApproved(article: ArticleRef, actorId: string): Promise<void> {
  const authorUserId = await userIdForAuthor(article.authorId);
  if (!authorUserId || authorUserId === actorId) return;
  await emit({
    userIds: [authorUserId],
    message: `"${titleOf(article)}" was approved.`,
    link: editorLink(article.id),
  });
}

/** A reviewer asked for changes. Tell the author, and carry the reason. */
export async function notifyChangesRequested(
  article: ArticleRef,
  actorId: string,
  reason: string
): Promise<void> {
  const authorUserId = await userIdForAuthor(article.authorId);
  if (!authorUserId || authorUserId === actorId) return;
  const summary = reason.trim().slice(0, 140);
  await emit({
    userIds: [authorUserId],
    message: `Changes requested on "${titleOf(article)}": ${summary}`,
    link: editorLink(article.id),
  });
}

/** A reviewer rejected an article. Tell the author, and carry the reason. */
export async function notifyRejected(
  article: ArticleRef,
  actorId: string,
  reason: string
): Promise<void> {
  const authorUserId = await userIdForAuthor(article.authorId);
  if (!authorUserId || authorUserId === actorId) return;
  const summary = reason.trim().slice(0, 140);
  await emit({
    userIds: [authorUserId],
    message: `"${titleOf(article)}" was rejected: ${summary}`,
    link: editorLink(article.id),
  });
}

/** An article went live. Tell the author. */
export async function notifyPublished(article: ArticleRef, actorId: string): Promise<void> {
  const authorUserId = await userIdForAuthor(article.authorId);
  if (!authorUserId || authorUserId === actorId) return;
  await emit({
    userIds: [authorUserId],
    message: `"${titleOf(article)}" is now published.`,
    link: editorLink(article.id),
  });
}

/** An article was taken down. Tell the author. */
export async function notifyUnpublished(article: ArticleRef, actorId: string): Promise<void> {
  const authorUserId = await userIdForAuthor(article.authorId);
  if (!authorUserId || authorUserId === actorId) return;
  await emit({
    userIds: [authorUserId],
    message: `"${titleOf(article)}" was unpublished.`,
    link: editorLink(article.id),
  });
}
