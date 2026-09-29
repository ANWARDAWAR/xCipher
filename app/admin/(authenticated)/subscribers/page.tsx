export const runtime = 'edge';
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canViewSubscribers } from "@/lib/permissions";
import { db } from "@/lib/db";
import { eq, ilike, sql } from "drizzle-orm";
import { subscriber as subscriberTable } from "@/lib/db/schema";
import SubscribersClient from "./SubscribersClient";
import { Role } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Subscribers | xSypher",
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

  let whereClause = undefined;
  if (query) {
    whereClause = ilike(subscriberTable.email, `%${query}%`);
  }

  const [totalResult, activeResult, unsubscribedResult, bouncedResult, subscribers, totalItemsResult] = await Promise.all([
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(subscriberTable),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(subscriberTable).where(eq(subscriberTable.status, "ACTIVE")),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(subscriberTable).where(eq(subscriberTable.status, "UNSUBSCRIBED")),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(subscriberTable).where(eq(subscriberTable.status, "BOUNCED")),
    db.query.subscriber.findMany({
      where: whereClause,
      orderBy: (s, { desc }) => [desc(s.createdAt)],
      offset: skip,
      limit: limit,
      columns: { id: true, email: true, status: true, source: true, consentAt: true, createdAt: true },
    }),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(subscriberTable).where(whereClause)
  ]);

  const total = totalResult[0]?.count || 0;
  const active = activeResult[0]?.count || 0;
  const unsubscribed = unsubscribedResult[0]?.count || 0;
  const bounced = bouncedResult[0]?.count || 0;
  const totalItems = totalItemsResult[0]?.count || 0;

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
          <h1 className="text-3xl font-display font-semibold text-ink tracking-tight">Subscribers</h1>
          <p className="text-muted mt-2 text-[15px]">Audience growth, newsletter distribution, and subscriber status.</p>
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
