export default function Loading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse" aria-busy="true">
      <div className="pb-6 border-b border-line space-y-3">
        <div className="h-7 w-32 bg-surface-2 rounded" />
        <div className="h-4 w-2/3 bg-surface-2 rounded" />
      </div>
      <div className="h-9 w-full bg-surface-2 rounded-md" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-[16/10] bg-surface-2 rounded-md" />
            <div className="h-3 w-24 bg-surface-2 rounded" />
            <div className="h-3 w-32 bg-surface-2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
