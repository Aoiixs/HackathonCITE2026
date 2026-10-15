import {
  CardsSkeleton,
  FiltersSkeleton,
  HeadingSkeleton,
  LoadingFrame,
  TableSkeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <CardsSkeleton count={3} />
      <FiltersSkeleton count={3} />
      <TableSkeleton rows={8} cols={6} />
    </LoadingFrame>
  );
}
