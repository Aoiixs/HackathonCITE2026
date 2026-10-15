import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HeadingSkeleton, LoadingFrame, Skeleton } from "@/components/skeletons";

// The Menu screen has two columns: product tiles and the order.
export default function Loading() {
  return (
    <LoadingFrame>
      <HeadingSkeleton />
      <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-full" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-28" />
            ))}
          </div>
        </div>
        <Card className="h-fit">
          <CardHeader>
            <Skeleton className="h-6 w-20" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </div>
    </LoadingFrame>
  );
}
