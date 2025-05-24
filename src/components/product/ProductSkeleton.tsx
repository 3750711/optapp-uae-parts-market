
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const ProductSkeleton: React.FC = () => {
  return (
    <div className="animate-fade-in">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <Skeleton className="h-6 w-96" />
      </div>
      
      {/* Header skeleton */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <Skeleton className="h-8 w-3/4 mb-2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gallery skeleton */}
        <div>
          <Skeleton className="w-full aspect-square rounded-lg mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
        
        {/* Info skeleton */}
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          
          <div className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
