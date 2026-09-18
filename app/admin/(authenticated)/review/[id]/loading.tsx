import { SkeletonPage, SkeletonHeader, SkeletonEditor } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading review">
      <SkeletonHeader />
      <SkeletonEditor />
    </SkeletonPage>
  );
}
