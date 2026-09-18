import { SkeletonPage, SkeletonHeader, SkeletonTable } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading categories and tags">
      <SkeletonHeader />
      <SkeletonTable rows={6} columns={3} />
    </SkeletonPage>
  );
}
