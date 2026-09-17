import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canViewSubscribers } from "@/lib/permissions";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SubscribersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!canViewSubscribers(user.role as Role)) redirect("/admin");

  const [total, active, unsubscribed, bounced, recent] = await Promise.all([
    db.subscriber.count(),
    db.subscriber.count({ where: { status: "ACTIVE" } }),
    db.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    db.subscriber.count({ where: { status: "BOUNCED" } }),
    db.subscriber.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, email: true, source: true, consentAt: true, createdAt: true },
    }),
  ]);

  const statCardStyle = (color: string) => ({
    padding: "20px 24px",
    background: "var(--paper)",
    border: `1px solid var(--line)`,
    borderTop: `3px solid ${color}`,
    borderRadius: "var(--r-md)",
    textAlign: "center" as const,
  });

  return (
    <>
      <div style={{ marginBottom: "24px", borderBottom: "1px solid var(--line)", paddingBottom: "16px" }}>
        <h1>Subscribers</h1>
        <p className="cs-sub">Newsletter subscriber list — read-only. Manage unsubscribes via the token link sent to each reader.</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px", marginBottom: "32px" }}>
        <div style={statCardStyle("var(--accent)")}>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>Total</div>
        </div>
        <div style={statCardStyle("var(--success, #22c55e)")}>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{active}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>Active</div>
        </div>
        <div style={statCardStyle("var(--ink-muted)")}>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{unsubscribed}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>Unsubscribed</div>
        </div>
        <div style={statCardStyle("var(--error, #e53e3e)")}>
          <div style={{ fontSize: "28px", fontWeight: 700 }}>{bounced}</div>
          <div style={{ fontSize: "12px", color: "var(--ink-muted)", marginTop: "4px" }}>Bounced</div>
        </div>
      </div>

      {/* Recent subscribers table */}
      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", fontSize: "13px", fontWeight: 700 }}>
          Recent Active Subscribers (last 50)
        </div>
        {recent.length === 0 ? (
          <p style={{ padding: "24px 20px", color: "var(--ink-muted)", fontSize: "14px" }}>No active subscribers yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)" }}>
                  {["Email", "Source", "Subscribed"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 20px", fontWeight: 600, color: "var(--ink-muted)", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 20px", fontFamily: "var(--f-mono, monospace)", fontSize: "12px" }}>{s.email}</td>
                    <td style={{ padding: "10px 20px", color: "var(--ink-muted)" }}>{s.source}</td>
                    <td style={{ padding: "10px 20px", color: "var(--ink-muted)", whiteSpace: "nowrap" }}>
                      {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
