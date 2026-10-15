import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingFrame, Skeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
      <LoadingFrame>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-52" />
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-11 w-full" />
          </CardContent>
        </Card>
      </LoadingFrame>
    </main>
  );
}
