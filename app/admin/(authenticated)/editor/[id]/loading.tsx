import { SkeletonPage, SkeletonHeader, SkeletonEditor } from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading article">
      <SkeletonHeader />
      <SkeletonEditor />
    </SkeletonPage>
  );
}
