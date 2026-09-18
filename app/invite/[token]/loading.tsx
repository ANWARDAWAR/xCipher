/**
 * Shown while the server component resolves the invitation token.
 *
 * Without this file an unreachable database presents as a blank white page
 * with a spinning tab and nothing else -- Prisma has no default query timeout,
 * so `findUnique` simply never settles and the route never returns. That is
 * indistinguishable from a broken link to the person holding the invitation.
 *
 * This is deliberately a plain centred message rather than a skeleton of the
 * form. A skeleton would promise a form that may never arrive; the invitation
 * may well be invalid, in which case the form is the wrong thing to preview.
 */
export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[var(--paper)] text-[var(--ink)]"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <svg
          className="animate-spin h-5 w-5 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="text-xs uppercase tracking-[0.12em] text-[var(--muted)] font-[family:var(--f-ui)]">
          Checking invitation
        </span>
      </div>
    </div>
  );
}
