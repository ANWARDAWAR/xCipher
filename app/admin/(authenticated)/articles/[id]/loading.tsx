// Mirrors the detail page's masthead → milestones → history rhythm so the
// layout does not jump when the real content arrives.
export default function Loading() {
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-pulse" aria-busy="true">
      <div className="h-3 w-24 bg-surface-2 rounded" />

      <div className="space-y-4 pb-8 border-b border-line">
        <div className="h-5 w-24 bg-surface-2 rounded-full" />
        <div className="space-y-2">
          <div className="h-9 w-3/4 bg-surface-2 rounded" />
          <div className="h-9 w-1/2 bg-surface-2 rounded" />
        </div>
        <div className="h-4 w-2/3 bg-surface-2 rounded" />
        <div className="flex gap-4 pt-1">
          <div className="h-4 w-28 bg-surface-2 rounded" />
          <div className="h-4 w-20 bg-surface-2 rounded" />
          <div className="h-4 w-16 bg-surface-2 rounded" />
        </div>
        <div className="flex gap-2 pt-1">
          <div className="h-9 w-24 bg-surface-2 rounded-md" />
          <div className="h-9 w-28 bg-surface-2 rounded-md" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-3 w-20 bg-surface-2 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-16 bg-surface-2 rounded" />
              <div className="h-4 w-32 bg-surface-2 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-5 pt-8 border-t border-line">
        <div className="h-3 w-16 bg-surface-2 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 pb-6">
            <div className="w-4 h-4 rounded-full bg-surface-2 shrink-0 mt-1" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-56 bg-surface-2 rounded" />
              <div className="h-3 w-40 bg-surface-2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
