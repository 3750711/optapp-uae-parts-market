
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StoreSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {/* Image skeleton */}
      <div className="aspect-video relative overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
      
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-2/3" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" />
            <Skeleton className="h-4 w-8" />
          </div>
        </div>
        <Skeleton className="h-4 w-full mt-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      
      <CardContent className="space-y-2 flex-grow">
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        
        <div className="flex flex-wrap gap-1 mt-4">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-14" />
        </div>
      </CardContent>
      
      <div className="p-6 pt-0">
        <Skeleton className="h-10 w-full" />
      </div>
    </Card>
  );
};

export default StoreSkeleton;
