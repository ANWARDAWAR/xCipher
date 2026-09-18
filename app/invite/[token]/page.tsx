import { db } from "@/lib/db";
import Link from "next/link";
import AcceptInviteForm from "./AcceptInviteForm";

export const metadata = {
  title: "Accept Invitation — xSypher Editorial",
};

export default async function InviteAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const invitation = await db.invitation.findUnique({
    where: { token },
  });

  const isInvalid =
    !invitation || invitation.status !== "PENDING" || invitation.expires < new Date();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative bg-[var(--paper)] text-[var(--ink)]"
      style={{
        backgroundImage:
          "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    >
      <div className="bg-[var(--surface)] border border-[var(--line)] shadow-2xl rounded-[var(--r-lg)] p-8 max-w-md w-full relative z-10">
        {/* Exact xSypher Brand SVG Logo */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="xSypher">
            <svg width="28" height="28" viewBox="0 0 26 26" aria-hidden="true" className="text-[var(--ink)]">
              <rect x="1" y="1" width="10" height="10" fill="currentColor" />
              <rect x="15" y="1" width="10" height="10" fill="currentColor" opacity=".32" />
              <rect x="1" y="15" width="10" height="10" fill="currentColor" opacity=".32" />
              <path
                d="M15.5 15.5 24.5 24.5M24.5 15.5l-9 9"
                stroke="var(--accent)"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
            <span className="wm">
              x<span className="wm-x">Cipher</span>
            </span>
          </Link>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] font-[family:var(--f-ui)] font-semibold mt-2">
            Editorial Newsroom
          </span>
        </div>

        {isInvalid ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-bold mb-2 text-[var(--ink)]"
              style={{ fontFamily: "var(--f-display)" }}
            >
              Invitation Expired or Invalid
            </h2>
            <p className="text-[var(--muted)] text-sm leading-relaxed mb-6 font-[family:var(--f-ui)]">
              This invitation link is no longer valid or has already been used. Please contact your newsroom administrator to request a new invitation.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-[var(--r-sm)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line-2)] font-[family:var(--f-ui)] font-semibold text-xs uppercase tracking-wider transition-all"
            >
              Return to Homepage
            </Link>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6 pb-6 border-b border-[var(--line)]">
              <h1
                className="text-2xl font-bold tracking-tight text-[var(--ink)] mb-2"
                style={{ fontFamily: "var(--f-display)" }}
              >
                Accept Invitation
              </h1>
              <p className="text-[var(--muted)] text-xs font-[family:var(--f-ui)] leading-relaxed">
                You have been invited to join xSypher with{" "}
                <span className="inline-block font-semibold uppercase tracking-wider text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 px-2 py-0.5 rounded-[var(--r-sm)]">
                  {invitation.role}
                </span>{" "}
                privileges.
              </p>
            </div>

            <AcceptInviteForm token={token} email={invitation.email} />
          </div>
        )}
      </div>
    </div>
  );
}
