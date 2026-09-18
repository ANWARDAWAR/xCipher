import { SkeletonPage, SkeletonHeader, SkeletonForm } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading invitation form">
      <SkeletonHeader />
      <SkeletonForm fields={2} />
    </SkeletonPage>
  );
}
