import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewAuditLogs } from "@/lib/permissions";
import { Role } from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Audit Logs | xCipher",
};

export default async function AuditLogsPage() {
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
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
  });

  return (
    <>
      <header className="cs-header">
        <div>
          <h1 className="cs-title">Audit Logs</h1>
          <p className="cs-deck">System-wide event tracking and access history.</p>
        </div>
      </header>

      <div className="table-responsive bg-black/20 rounded-xl overflow-hidden border border-white/5">
        <table className="cs-table w-full text-left">
          <thead>
            <tr className="bg-white/5">
              <th className="p-4 border-b border-white/10 text-white/50 font-medium text-sm">Timestamp</th>
              <th className="p-4 border-b border-white/10 text-white/50 font-medium text-sm">Actor</th>
              <th className="p-4 border-b border-white/10 text-white/50 font-medium text-sm">Action</th>
              <th className="p-4 border-b border-white/10 text-white/50 font-medium text-sm">Entity</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                <td className="p-4 text-white/60 text-sm whitespace-nowrap">
                  {log.createdAt.toLocaleString()}
                </td>
                <td className="p-4 font-medium text-sm">
                  {log.user?.name || log.user?.email || "System"}
                </td>
                <td className="p-4 text-sm">
                  <span className="px-2 py-1 bg-white/10 rounded-md text-xs font-mono text-white/90">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-white/60 text-sm">
                  {log.entityType} {log.entityId && <span className="font-mono text-xs ml-1">({log.entityId.slice(0, 8)})</span>}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-white/50">
                  No events logged yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
