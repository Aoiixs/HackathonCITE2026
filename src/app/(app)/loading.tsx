import {
  CardsSkeleton,
  HeadingSkeleton,
  LoadingFrame,
  TableSkeleton,
} from "@/components/skeletons";

// Shown while the Dashboard loads, and for any page below it that does not
// have its own loading.tsx.
export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <CardsSkeleton count={4} />
      <TableSkeleton rows={6} cols={5} />
    </LoadingFrame>
  );
}
