
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

ProductCardSkeleton.displayName = "ProductCardSkeleton";
ProductGridSkeleton.displayName = "ProductGridSkeleton";
StepSkeleton.displayName = "StepSkeleton";
