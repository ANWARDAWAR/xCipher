"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary for the invitation acceptance route.
 *
 * The console has had one of these at app/admin/(authenticated)/error.tsx for
 * a while, but /invite sits outside that route group and inherited nothing, so
 * a thrown error here produced Next's bare default page.
 *
 * The database branch matters more on this route than anywhere else in the
 * app. The person opening an invitation link is, by definition, not yet a user
 * -- they cannot check a dashboard, and they have no way to tell a dead link
 * from a dead database. Saying which one it is costs nothing and saves them
 * contacting an administrator about a problem that is not theirs.
 */
export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Invitation page error:", error);
  }, [error]);

  const isDbError =
    error.message?.includes("Can't reach database server") ||
    error.message?.includes("PrismaClientKnownRequestError") ||
    error.message?.includes("PrismaClientInitializationError") ||
    error.message?.includes("did not initialize yet") ||
    error.message?.includes("connect to the database");

  return (
    <div
      role="alert"
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--paper)] text-[var(--ink)]"
    >
      <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--r-lg)] p-8 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bad)]/10 text-[var(--bad)] mb-4">
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <h1
          className="text-xl font-bold mb-2 text-[var(--ink)]"
          style={{ fontFamily: "var(--f-display)" }}
        >
          {isDbError ? "Cannot reach the database" : "Something went wrong"}
        </h1>

        <p className="text-[var(--muted)] text-sm leading-relaxed mb-6 font-[family:var(--f-ui)]">
          {isDbError
            ? "Your invitation link is probably fine — the server just cannot reach its database right now. Try again in a moment, or let the person who invited you know."
            : "We could not load this invitation. Try again, and contact the person who invited you if it keeps happening."}
        </p>

        {isDbError && (
          <div className="bg-[var(--surface-2)] border border-[var(--line)] rounded-[var(--r-sm)] p-3 mb-6 text-left overflow-auto max-h-32">
            <code className="text-[11px] text-[var(--muted)] whitespace-pre-wrap font-mono break-words">
              {error.message}
            </code>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 px-4 rounded-[var(--r-sm)] bg-[var(--accent)] hover:bg-[var(--accent-deep)] text-white font-[family:var(--f-ui)] font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-[var(--r-sm)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-[var(--ink)] border border-[var(--line-2)] font-[family:var(--f-ui)] font-semibold text-xs uppercase tracking-wider transition-all"
          >
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
