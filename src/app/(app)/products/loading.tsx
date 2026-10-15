import {
  FiltersSkeleton,
  HeadingSkeleton,
  LoadingFrame,
  TableSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <FiltersSkeleton count={3} />
      <TableSkeleton rows={7} cols={6} />
    </LoadingFrame>
  );
}
