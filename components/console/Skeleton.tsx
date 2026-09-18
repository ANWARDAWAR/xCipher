// ──────────────────────────────────────────────────────────────────────────────
// Skeleton primitives for console loading states.
//
// Server components, deliberately: a loading.tsx renders while the page's data
// is still being fetched, so shipping client JS to draw grey rectangles would
// make the thing it is covering for arrive later.
//
// Every skeleton block is aria-hidden and the container carries the live region
// instead. Announcing "loading" once is useful; announcing forty empty boxes is
// not.
// ──────────────────────────────────────────────────────────────────────────────

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`bg-surface-2 rounded animate-pulse ${className}`} />;
}

/** Page header: title, subtitle, and a right-aligned action. */
export function SkeletonHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-line">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-56" />
        <SkeletonBlock className="h-4 w-80 max-w-full" />
      </div>
      <SkeletonBlock className="h-9 w-32" />
    </div>
  );
}

/** Filter bar: status tabs plus a search row. */
export function SkeletonFilterBar() {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-1.5 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-7 w-24 shrink-0 rounded-lg" />
        ))}
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <SkeletonBlock className="h-9 w-full max-w-md rounded-lg" />
        <div className="flex items-center gap-2">
          <SkeletonBlock className="h-9 w-32 rounded-lg" />
          <SkeletonBlock className="h-9 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Article list rows. Mirrors the real layout closely enough that content does
 * not jump when it arrives -- a skeleton whose shape differs from the thing it
 * replaces is worse than no skeleton at all.
 */
export function SkeletonArticleList({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl shadow-xs mt-4 overflow-hidden">
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5">
            <SkeletonBlock className="w-20 h-12 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <SkeletonBlock className="h-4 w-3/4 max-w-md" />
              <SkeletonBlock className="h-3 w-1/2 max-w-xs" />
            </div>
            <SkeletonBlock className="h-6 w-24 rounded-md shrink-0 hidden md:block" />
            <SkeletonBlock className="h-6 w-16 rounded shrink-0 hidden lg:block" />
            <SkeletonBlock className="h-8 w-16 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic table skeleton for the audit-log, comments and subscriber screens. */
export function SkeletonTable({ rows = 8, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-surface border border-line rounded-xl shadow-xs mt-4 overflow-hidden">
      <div className="border-b border-line bg-surface-2/60 px-4 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-4 py-3.5 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBlock key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Wraps a skeleton tree in a single polite live region. */
export function SkeletonPage({
  label = "Loading",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="space-y-6 max-w-7xl mx-auto">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
