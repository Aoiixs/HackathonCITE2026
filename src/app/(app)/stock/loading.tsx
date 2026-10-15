import {
  FormSkeleton,
  HeadingSkeleton,
  LoadingFrame,
  Skeleton,
} from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28 rounded-full" />
        <Skeleton className="h-10 w-28 rounded-full" />
      </div>
      <FormSkeleton fields={5} />
    </LoadingFrame>
  );
}
