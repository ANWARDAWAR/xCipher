import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonArticleList,
} from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading the review queue">
      <SkeletonHeader />
      <SkeletonArticleList rows={5} />
    </SkeletonPage>
  );
}
