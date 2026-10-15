import { HeadingSkeleton, LoadingFrame, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <TableSkeleton rows={5} cols={4} />
    </LoadingFrame>
  );
}
