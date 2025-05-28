
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const EnhancedSellerListingsSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-48" />
        <Badge variant="outline" className="opacity-50">
          <Skeleton className="h-4 w-16" />
        </Badge>
      </div>
      
      {/* Products grid skeleton with more realistic layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[400px]">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-card overflow-hidden border border-gray-100">
            {/* Image skeleton with proper aspect ratio */}
            <div className="relative">
              <Skeleton className="w-full aspect-[16/9]" />
              {/* Status badge skeleton */}
              <div className="absolute top-2 right-2">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              {/* Lot number skeleton */}
              <div className="absolute top-2 left-2">
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
            </div>
            
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              {/* Title skeleton - 2 lines */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              
              {/* Brand/Model skeleton */}
              <Skeleton className="h-3 w-2/3" />
              
              {/* Price and seller skeleton */}
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Load more skeleton */}
      <div className="flex justify-center pt-6">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
};

export default EnhancedSellerListingsSkeleton;
