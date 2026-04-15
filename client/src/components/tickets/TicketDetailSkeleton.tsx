import { Skeleton } from "@/components/ui/skeleton";

export function TicketDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_240px] lg:items-start lg:gap-8">
      <div className="grid gap-5">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-2">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="grid gap-2">
          <Skeleton className="h-5 w-72" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid gap-2 rounded-[20px] border border-border/70 bg-card p-5 shadow-sm">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-[92%]" />
          <Skeleton className="h-6 w-[78%]" />
        </div>
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="grid gap-1" key={index}>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
