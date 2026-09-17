import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canViewSubscribers } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import SubscribersClient from "./SubscribersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscribers | xCipher",
};

export default async function SubscribersPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!canViewSubscribers(user.role as Role)) redirect("/admin");

  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 25;
  const skip = (Math.max(1, page) - 1) * limit;

  const where: any = {};

  if (query) {
    where.email = { contains: query, mode: 'insensitive' };
  }

  const [total, active, unsubscribed, bounced, subscribers, totalItems] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.count({ where: { status: "ACTIVE" } }),
    db.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    db.subscriber.count({ where: { status: "BOUNCED" } }),
    db.subscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, email: true, status: true, source: true, consentAt: true, createdAt: true },
    }),
    db.subscriber.count({ where })
  ]);

  const stats = {
    total,
    active,
    unsubscribed,
    bounced,
  };

  const formattedSubscribers = subscribers.map(s => ({
    ...s,
    consentAt: s.consentAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <>
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">Subscribers</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-[15px]">Audience growth, newsletter distribution, and subscriber status.</p>
        </div>
      </header>

      <SubscribersClient 
        initialSubscribers={formattedSubscribers}
        stats={stats}
        totalItems={totalItems}
        currentPage={page}
        itemsPerPage={limit}
      />
    </>
  );
}
