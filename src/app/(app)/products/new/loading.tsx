import { FormSkeleton, HeadingSkeleton, LoadingFrame } from "@/components/skeletons";

export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <FormSkeleton fields={5} />
    </LoadingFrame>
  );
}
