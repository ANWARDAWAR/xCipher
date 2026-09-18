import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewAuditLogs } from "@/lib/permissions";
import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuditLogsClient from "./AuditLogsClient";

export const metadata = {
  title: "Audit Logs | xCipher",
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

  const where: any = {};

  if (query) {
    where.OR = [
      { action: { contains: query, mode: 'insensitive' } },
      { entityType: { contains: query, mode: 'insensitive' } },
      { entityId: { contains: query, mode: 'insensitive' } },
      { user: { name: { contains: query, mode: 'insensitive' } } },
      { user: { email: { contains: query, mode: 'insensitive' } } },
    ];
  }

  if (category && category !== 'All') {
    if (category === 'Publishing') {
      where.action = { in: ['ARTICLE_PUBLISH', 'ARTICLE_UPDATE', 'ARTICLE_CREATE', 'ARTICLE_DELETE'] };
    } else if (category === 'Authentication') {
      where.action = { in: ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'PASSWORD_RESET', 'LOGOUT'] };
    } else if (category === 'User Management') {
      where.action = { in: ['USER_INVITED', 'USER_REVOKED', 'ROLE_CHANGED'] };
    } else if (category === 'System') {
      where.action = { in: ['CONFIG_CHANGE', 'TAXONOMY_ADD', 'TAXONOMY_REMOVE'] };
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
    where.createdAt = { gte: startDate };
  }

  const [logs, totalLogs] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    }),
    db.auditLog.count({ where })
  ]);

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
