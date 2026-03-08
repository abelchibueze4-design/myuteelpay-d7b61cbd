import { Skeleton } from "@/components/ui/skeleton";

export const DashboardSkeleton = () => (
  <div className="min-h-screen bg-background relative">
    {/* Mobile Header Skeleton */}
    <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30">
      <div className="max-w-[420px] mx-auto px-4 py-3 flex items-center justify-between">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="w-9 h-9 rounded-full" />
      </div>
    </div>

    <div className="max-w-[420px] lg:max-w-7xl mx-auto px-4 space-y-4 pb-24 pt-4">
      {/* Wallet Card Skeleton */}
      <div className="rounded-2xl p-5 bg-primary/20 space-y-4">
        <Skeleton className="h-5 w-24 bg-white/20" />
        <Skeleton className="h-10 w-48 bg-white/20" />
        <div className="flex gap-2.5">
          <Skeleton className="flex-1 h-11 rounded-2xl bg-white/20" />
          <Skeleton className="flex-1 h-11 rounded-2xl bg-white/20" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-3 gap-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 p-3 flex flex-col items-center gap-2">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="rounded-2xl border border-border/30 divide-y divide-border/30">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2.5">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-2 w-16" />
                </div>
              </div>
              <div className="space-y-1.5 text-right">
                <Skeleton className="h-3 w-16 ml-auto" />
                <Skeleton className="h-2 w-10 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export const ServicePageSkeleton = () => (
  <div className="min-h-screen bg-secondary pb-12">
    <div className="bg-primary/20 px-4 py-6 mb-6">
      <div className="container mx-auto">
        <Skeleton className="h-6 w-32" />
      </div>
    </div>
    <div className="container mx-auto px-4 max-w-2xl">
      <div className="bg-card rounded-2xl p-6 space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-3 w-28" />
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-14 rounded-2xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        </div>
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </div>
  </div>
);
