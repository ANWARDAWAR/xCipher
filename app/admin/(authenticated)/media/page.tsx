import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Role } from "@prisma/client";
import { authorize, buildArticleScope, Actor } from "@/lib/capabilities";
import { ALLOWED_MEDIA_DOMAINS } from "@/lib/sanitize";
import MediaLibraryClient, { type MediaItem } from "./MediaLibraryClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Media | xCipher" };

// ─────────────────────────────────────────────────────────────────────────────
// Media library — /admin/media
//
// A deliberate scoping note, because "media library" usually implies uploads:
// this codebase has no file upload anywhere. Images are URLs pointing at an
// allowlist of external hosts (Unsplash, Pexels, Wikimedia, and so on), and
// there is no bucket, no storage client and no multipart handler. Building an
// upload pipeline would mean provisioning storage and credentials that cannot
// be verified from here.
//
// So this is a catalog of the images already in use rather than an asset store.
// It answers the questions that actually come up without one: what art do we
// already have, where is each image used, is anything pointing at a host we no
// longer allow, and does the same picture appear on six different articles.
//
// Uploads remain a separate, later piece of work. When they land, this page is
// where they belong.
// ─────────────────────────────────────────────────────────────────────────────

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export default async function MediaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { authorProfile: true },
  });
  if (!dbUser) redirect("/admin/login");

  const actor: Actor = {
    id: dbUser.id,
    role: dbUser.role as Role,
    authorId: dbUser.authorProfile?.id || null,
  };

  if (!authorize(actor.role, "console.access")) redirect("/admin/login");

  // Scoped exactly like the article list. An author sees the art on their own
  // and on published pieces, not on someone else's unpublished draft -- a lead
  // image can give away an unannounced story as readily as its headline.
  const scope = buildArticleScope(actor);

  const articles = await db.article.findMany({
    where: { AND: [{ img: { not: null } }, scope] },
    select: {
      id: true,
      title: true,
      img: true,
      status: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    // Bounded like every other list in the console. A newsroom with 50k
    // articles should not stream 50k rows into a grid.
    take: 500,
  });

  // Group by URL. The same image genuinely does get reused across articles, and
  // showing it six times as six tiles hides exactly the fact worth surfacing.
  const byUrl = new Map<string, MediaItem>();

  for (const a of articles) {
    if (!a.img) continue;
    const existing = byUrl.get(a.img);
    if (existing) {
      existing.usages.push({ id: a.id, title: a.title, status: a.status });
      continue;
    }
    const host = hostOf(a.img);
    byUrl.set(a.img, {
      url: a.img,
      host,
      // A null host means the string does not parse as a URL at all -- a
      // relative path or a typo. Treated as unapproved, since it is certainly
      // not on the allowlist.
      approved: host ? ALLOWED_MEDIA_DOMAINS.includes(host) : false,
      lastUsed: a.updatedAt.toISOString(),
      usages: [{ id: a.id, title: a.title, status: a.status }],
    });
  }

  const items = [...byUrl.values()];
  const unapprovedCount = items.filter((i) => !i.approved).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <header className="pb-6 border-b border-line space-y-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
            Media
          </h1>
          <span className="text-sm text-muted font-[var(--f-ui)]">
            {items.length} image{items.length === 1 ? "" : "s"} in use
          </span>
        </div>
        <p className="text-sm text-muted font-[var(--f-ui)] max-w-2xl">
          Every lead image currently referenced by an article you can see,
          grouped by URL. This is a catalog of what is in use — there is no file
          upload in this system yet, so images are links to approved external
          hosts.
        </p>
        {unapprovedCount > 0 && (
          <p className="text-sm text-[var(--warn)] font-[var(--f-ui)]">
            {unapprovedCount} image{unapprovedCount === 1 ? "" : "s"} point
            {unapprovedCount === 1 ? "s" : ""} at a host that is not on the
            approved list. These may fail to load, and new articles cannot use
            them.
          </p>
        )}
      </header>

      <MediaLibraryClient items={items} />
    </div>
  );
}
