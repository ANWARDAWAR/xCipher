import { SkeletonPage, SkeletonHeader, SkeletonTable } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading subscribers">
      <SkeletonHeader />
      <SkeletonTable rows={8} columns={4} />
    </SkeletonPage>
  );
}
