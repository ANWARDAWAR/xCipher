import { SkeletonPage, SkeletonHeader, SkeletonTable } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading authors">
      <SkeletonHeader />
      <SkeletonTable rows={8} columns={5} />
    </SkeletonPage>
  );
}
