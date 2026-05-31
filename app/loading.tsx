import { Skeleton } from "@/components/ui/skeleton";

function CardSkeleton({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 space-y-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
      </div>
      {/* Body rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function NewsCardSkeleton() {
  return (
    <div className="rounded-2xl border bg-card p-4 space-y-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-16 ml-auto" />
      </div>
      <div className="flex gap-2 flex-wrap">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl border p-3">
            <Skeleton className="h-14 w-14 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>

      {/* Row 2: Fuel + Exchange Rates */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-2xl border bg-card p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-6 w-36 rounded-full" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton rows={8} />
        </div>
      </div>

      {/* Row 3: Electricity + News */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton rows={4} />
        <NewsCardSkeleton />
      </div>
    </div>
  );
}
