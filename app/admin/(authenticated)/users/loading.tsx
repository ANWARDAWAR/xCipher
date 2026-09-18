import { SkeletonPage, SkeletonHeader, SkeletonTable } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading users">
      <SkeletonHeader />
      <SkeletonTable rows={8} columns={4} />
    </SkeletonPage>
  );
}
