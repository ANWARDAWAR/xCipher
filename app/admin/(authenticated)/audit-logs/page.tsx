export const runtime = 'edge';
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewAuditLogs } from "@/lib/permissions";
import { eq, or, ilike, and, inArray, gte, sql } from "drizzle-orm";
import { auditLog as auditLogTable, user as userTable } from "@/lib/db/schema";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";
import { Role } from "@/lib/types";

export const metadata = {
  title: "Audit Logs | xSypher",
};

export default async function AuditLogsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect("/admin/login");
  }

  if (!canViewAuditLogs(currentUser.role as Role)) {
    return (
      <div className="cs-card" style={{ maxWidth: "600px", margin: "2rem auto", textAlign: "center", padding: "2.5rem 1.5rem" }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--accent-soft)",
          color: "var(--accent)", display: "inline-flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 1.25rem"
        }}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "var(--f-display)", fontSize: "1.35rem", marginBottom: "0.5rem" }}>
          Permission Required
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.875rem", fontFamily: "var(--f-ui)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          Only <strong>ADMIN</strong> roles can view audit logs.<br />
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/admin" className="btn-cs">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const query = typeof searchParams.query === 'string' ? searchParams.query : undefined;
  const category = typeof searchParams.category === 'string' ? searchParams.category : undefined;
  const dateRange = typeof searchParams.dateRange === 'string' ? searchParams.dateRange : undefined;
  
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page, 10) : 1;
  const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit, 10) : 25;
  const skip = (Math.max(1, page) - 1) * limit;

  // Read once, alongside the query parameters, rather than in the JSX. The
  // client renders every relative age against this single value, so the whole
  // table agrees and nothing depends on the browser's clock.
  // Server component: this runs once per request and the value is passed down,
  // so the client never reads a clock of its own.
  // eslint-disable-next-line react-hooks/purity
  const renderedAt = Date.now();

  const filterConditions = [];

  if (query) {
    filterConditions.push(
      or(
        ilike(auditLogTable.action, `%${query}%`),
        ilike(auditLogTable.entityType, `%${query}%`),
        ilike(auditLogTable.entityId, `%${query}%`),
        sql`${auditLogTable.userId} IN (SELECT id FROM "User" WHERE "name" ILIKE ${`%${query}%`} OR "email" ILIKE ${`%${query}%`})`
      )
    );
  }

  if (category && category !== 'All') {
    if (category === 'Publishing') {
      filterConditions.push(inArray(auditLogTable.action, ['ARTICLE_PUBLISH', 'ARTICLE_UPDATE', 'ARTICLE_CREATE', 'ARTICLE_DELETE']));
    } else if (category === 'Authentication') {
      filterConditions.push(inArray(auditLogTable.action, ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET', 'LOGOUT']));
    } else if (category === 'User Management') {
      filterConditions.push(inArray(auditLogTable.action, ['USER_INVITED', 'USER_REVOKED', 'ROLE_CHANGED']));
    } else if (category === 'System') {
      filterConditions.push(inArray(auditLogTable.action, ['CONFIG_CHANGE', 'TAXONOMY_ADD', 'TAXONOMY_REMOVE']));
    }
  }

  if (dateRange && dateRange !== 'All Time') {
    const now = new Date();
    const startDate = new Date();
    if (dateRange === '24h') {
      startDate.setHours(now.getHours() - 24);
    } else if (dateRange === '7d') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === '30d') {
      startDate.setDate(now.getDate() - 30);
    }
    filterConditions.push(gte(auditLogTable.createdAt, startDate));
  }

  const whereClause = and(...filterConditions);

  const [logs, countResult] = await Promise.all([
    db.query.auditLog.findMany({
      where: whereClause,
      orderBy: (a, { desc }) => [desc(a.createdAt)],
      offset: skip,
      limit: limit,
      with: {
        user: {
          columns: { name: true, email: true },
        },
      },
    }),
    db.select({ count: sql`count(*)`.mapWith(Number) }).from(auditLogTable).where(whereClause)
  ]);
  const totalLogs = countResult[0]?.count || 0;

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-display font-semibold text-ink tracking-tight">Audit Logs</h1>
        <p className="text-muted mt-2 text-[15px]">System-wide security tracking, editorial activity, and access history.</p>
      </header>
      
      <AuditLogsClient 
        logs={logs} 
        totalLogs={totalLogs} 
        currentPage={page} 
        itemsPerPage={limit}
        renderedAt={renderedAt}
      />
    </>
  );
}
