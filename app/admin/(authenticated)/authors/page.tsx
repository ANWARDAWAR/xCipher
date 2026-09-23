import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/capabilities";
import { Role } from "@prisma/client";
import AuthorDirectoryTable from "./AuthorDirectoryTable";

export const metadata = {
  title: "Authors | xSypher",
};

export const dynamic = "force-dynamic";

/**
 * Authors directory.
 *
 * The Author model has existed since the beginning and drives every public
 * byline, but the console never exposed it -- author records could only be
 * reached indirectly, by editing the user they happen to be attached to. That
 * left orphaned Author rows (a byline with no login, which is legitimate for
 * guest contributors) completely invisible and unmanageable.
 *
 * Gated on `author.manage.all`, which OWNER and ADMIN hold. This is a
 * newsroom concern rather than an account-administration one, so EDITOR having
 * it -- while not having `user.manage` -- is the intended split.
 */
export default async function AuthorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (!authorize(user.role as Role, "author.manage.all")) {
    redirect("/admin");
  }

  // One grouped count instead of a per-author query. An N+1 here would be
  // invisible with a dozen authors and painful with two hundred.
  const [authors, publishedCounts] = await Promise.all([
    db.author.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        role: true,
        avatar: true,
        headline: true,
        email: true,
        verifiedTitle: true,
        joinedAt: true,
        _count: { select: { articles: true } },
        user: { select: { id: true, email: true, role: true } },
      },
    }),
    db.article.groupBy({
      by: ["authorId"],
      where: { status: "PUBLISHED", authorId: { not: null } },
      _count: { _all: true },
      _sum: { views: true },
    }),
  ]);

  const publishedByAuthor = new Map<string, { published: number; views: number }>(
    publishedCounts.map((row: { authorId: string | null; _count: { _all: number }; _sum: { views: number | null } }) => [
      row.authorId as string,
      { published: row._count._all, views: row._sum.views ?? 0 },
    ])
  );

  const rows = authors.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    role: a.role,
    avatar: a.avatar,
    headline: a.headline,
    email: a.email,
    verifiedTitle: a.verifiedTitle,
    joinedAt: a.joinedAt.toISOString(),
    totalArticles: a._count.articles,
    publishedArticles: publishedByAuthor.get(a.id)?.published ?? 0,
    totalViews: publishedByAuthor.get(a.id)?.views ?? 0,
    linkedUserEmail: a.user?.email ?? null,
    linkedUserRole: a.user?.role ?? null,
    // The settings editor is keyed by user id, not author id. An author with no
    // linked account cannot be edited there, so the row renders no Edit action
    // rather than a link that would silently open the actor's own profile.
    linkedUserId: a.user?.id ?? null,
  }));

  const unlinked = rows.filter((r) => !r.linkedUserEmail).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-row items-center justify-between gap-4 pb-5 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-ink font-[var(--f-ui)]">
              Authors
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-xs font-semibold text-muted">
              {rows.length} {rows.length === 1 ? "byline" : "bylines"}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1 font-[var(--f-ui)]">
            Public bylines and their output.
            {unlinked > 0 && (
              <>
                {" "}
                {unlinked} {unlinked === 1 ? "has" : "have"} no console account —
                normal for guest contributors.
              </>
            )}
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-ink bg-surface-2 hover:bg-surface-3 border border-line rounded-lg transition-colors shrink-0"
        >
          Manage accounts
        </Link>
      </div>

      <AuthorDirectoryTable authors={rows} />
    </div>
  );
}
