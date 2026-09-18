import {
  SkeletonPage,
  SkeletonHeader,
  SkeletonFilterBar,
  SkeletonArticleList,
} from "@/components/console/Skeleton";

export default function Loading() {
  return (
    <SkeletonPage label="Loading articles">
      <SkeletonHeader />
      <SkeletonFilterBar />
      <SkeletonArticleList rows={8} />
    </SkeletonPage>
  );
}
