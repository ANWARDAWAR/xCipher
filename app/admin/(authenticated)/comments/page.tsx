import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canModerateComments } from "@/lib/permissions";
import { db } from "@/lib/db";
import { eq, or, ilike, and, sql } from "drizzle-orm";
import { comment as commentTable } from "@/lib/db/schema";
import CommentsQueueClient from "./CommentsQueueClient";
import { Role, CommentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Comments Moderation | xSypher",
};

export default async function CommentsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (!canModerateComments(user.role as Role)) {
    redirect("/admin");
  }

  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
  const tab = typeof searchParams.tab === 'string' ? searchParams.tab : 'All';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 20;
  const skip = (Math.max(1, page) - 1) * limit;

  const filterConditions = [];

  if (query) {
    filterConditions.push(
      or(
        ilike(commentTable.displayName, `%${query}%`),
        ilike(commentTable.body, `%${query}%`)
      )
    );
  }

  if (tab !== 'All') {
    if (tab === 'Pending') filterConditions.push(eq(commentTable.status, 'PENDING'));
    if (tab === 'Approved') filterConditions.push(eq(commentTable.status, 'APPROVED'));
    if (tab === 'Spam') filterConditions.push(eq(commentTable.status, 'SPAM'));
    if (tab === 'Trash') filterConditions.push(eq(commentTable.status, 'REJECTED'));
  }

  const whereClause = filterConditions.length > 0 ? and(...filterConditions) : undefined;

  const [comments, countResult, counts] = await Promise.all([
    db.query.comment.findMany({
      where: whereClause,
      orderBy: (c, { desc }) => [desc(c.createdAt)],
      offset: skip,
      limit: limit,
      columns: {
        id: true,
        articleSlug: true,
        displayName: true,
        body: true,
        status: true,
        ipHash: true,
        createdAt: true,
        moderatorNote: true,
      },
      with: {
        moderator: { columns: { name: true } },
      }
    }),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(commentTable).where(whereClause),
    db.select({ status: commentTable.status, _count: sql`count(*)`.mapWith(Number) })
      .from(commentTable)
      .groupBy(commentTable.status)
  ]);
  const totalComments = countResult[0]?.count || 0;

  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    rejected: 0,
  };

  counts.forEach((c) => {
    const statusCount = Number(c._count);
    stats.total += statusCount;
    if (c.status === 'PENDING') stats.pending = statusCount;
    if (c.status === 'APPROVED') stats.approved = statusCount;
    if (c.status === 'SPAM') stats.spam = statusCount;
    if (c.status === 'REJECTED') stats.rejected = statusCount;
  });

  const formattedComments = comments.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-ink tracking-tight">Comments</h1>
          <p className="text-muted mt-2 text-[15px]">Review reader discourse, moderate comments, and manage spam.</p>
        </div>
      </header>

      <CommentsQueueClient 
        initialComments={formattedComments} 
        stats={stats}
        totalItems={totalComments}
        currentPage={page}
        itemsPerPage={limit}
      />
    </>
  );
}
