import { SkeletonPage, SkeletonHeader, SkeletonForm } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading settings">
      <SkeletonHeader />
      <SkeletonForm fields={6} />
    </SkeletonPage>
  );
}
