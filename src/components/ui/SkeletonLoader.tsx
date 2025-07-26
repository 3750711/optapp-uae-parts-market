
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const ProductCardSkeleton = React.memo(() => (
  <div className="border rounded-lg p-4 animate-pulse">
    <div className="flex gap-4">
      <Skeleton className="w-20 h-20 rounded-md" />
      <div className="flex-grow space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  </div>
));

export const ProductGridSkeleton = React.memo(({ count = 6 }: { count?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, index) => (
      <ProductCardSkeleton key={index} />
    ))}
  </div>
));

export const StepSkeleton = React.memo(() => (
  <div className="animate-pulse">
    <div className="flex items-center space-x-4 mb-8">
      {[1, 2, 3].map((_, index) => (
        <React.Fragment key={index}>
          <div className="flex items-center space-x-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-16" />
          </div>
          {index < 2 && <Skeleton className="h-4 w-4" />}
        </React.Fragment>
      ))}
    </div>
    <div className="border rounded-lg">
      <div className="p-6 border-b">
        <Skeleton className="h-6 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="p-6">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  </div>
));

export const DashboardSkeleton = React.memo(() => (
  <div className="space-y-6 sm:space-y-8 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center gap-4 p-6 bg-muted/50 rounded-2xl">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-32" />
      </div>
    </div>

    {/* Grid skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="p-6 border rounded-xl bg-card">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
));

ProductCardSkeleton.displayName = "ProductCardSkeleton";
ProductGridSkeleton.displayName = "ProductGridSkeleton";
StepSkeleton.displayName = "StepSkeleton";
DashboardSkeleton.displayName = "DashboardSkeleton";
