import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = {
  title: "Audit Logs | xCipher",
};

export default async function AuditLogsPage() {
  await requireRole(["OWNER", "ADMIN"]);

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
