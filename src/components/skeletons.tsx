import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Building blocks for the grey placeholders shown while a page loads.
// Each page's loading.tsx stacks a few of these into the page's own shape.

/** One grey pulsing block. Hidden from screen readers: it is only decoration. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-[var(--radius)] bg-secondary", className)}
    />
  );
}

/** Wraps a whole placeholder so a screen reader says "Loading…" once. */
export function LoadingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}

export function HeadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
  );
}

/** A row of summary cards. */
export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        count === 3 ? "lg:grid-cols-3" : "xl:grid-cols-4",
      )}
    >
      {Array.from({ length: count }, (_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** A row of filter boxes above a table. */
export function FiltersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-40" />
        </div>
      ))}
      <Skeleton className="h-10 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }, (_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} className="flex gap-4">
            {Array.from({ length: cols }, (_, c) => (
              <Skeleton key={c} className="h-6 flex-1" />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** A form: a label and a box per field, then a button. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-36" />
    </div>
  );
}
