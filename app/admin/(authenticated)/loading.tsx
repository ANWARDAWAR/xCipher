import { SkeletonPage, SkeletonHeader, SkeletonBlock } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading the dashboard">
      <SkeletonHeader />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface border border-line rounded-xl p-5 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-surface border border-line rounded-xl p-5 space-y-4">
            <SkeletonBlock className="h-4 w-40" />
            {Array.from({ length: 5 }).map((_, j) => (
              <SkeletonBlock key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
