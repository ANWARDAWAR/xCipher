import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canModerateComments } from "@/lib/permissions";
import { Role, CommentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import CommentsQueueClient from "./CommentsQueueClient";

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

  const where: any = {};

  if (query) {
    where.OR = [
      { displayName: { contains: query, mode: 'insensitive' } },
      { body: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (tab !== 'All') {
    if (tab === 'Pending') where.status = 'PENDING';
    if (tab === 'Approved') where.status = 'APPROVED';
    if (tab === 'Spam') where.status = 'SPAM';
    if (tab === 'Trash') where.status = 'REJECTED';
  }

  const [comments, totalComments, counts] = await Promise.all([
    db.comment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        articleSlug: true,
        displayName: true,
        body: true,
        status: true,
        ipHash: true,
        createdAt: true,
        moderatorNote: true,
        moderator: { select: { name: true } },
      },
    }),
    db.comment.count({ where }),
    db.comment.groupBy({
      by: ['status'],
      _count: true,
    })
  ]);

  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    spam: 0,
    rejected: 0,
  };

  counts.forEach((c) => {
    stats.total += c._count;
    if (c.status === 'PENDING') stats.pending = c._count;
    if (c.status === 'APPROVED') stats.approved = c._count;
    if (c.status === 'SPAM') stats.spam = c._count;
    if (c.status === 'REJECTED') stats.rejected = c._count;
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
