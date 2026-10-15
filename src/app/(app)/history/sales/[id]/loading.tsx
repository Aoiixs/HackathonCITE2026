import { LoadingFrame, Skeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <LoadingFrame>
      <Skeleton className="h-11 w-44" />
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col gap-4 p-6">
          <div className="flex flex-col items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    </LoadingFrame>
  );
}
