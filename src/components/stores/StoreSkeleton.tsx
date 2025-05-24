
import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const StoreSkeleton: React.FC = () => {
  return (
    <Card className="overflow-hidden h-full flex flex-col animate-pulse border-0 shadow-card">
      {/* Image skeleton */}
      <div className="aspect-video relative overflow-hidden">
        <Skeleton className="w-full h-full animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]" 
          style={{ 
            animation: 'pulse 1.5s ease-in-out infinite, shimmer 2s linear infinite' 
          }}
        />
        {/* Badge skeleton */}
        <div className="absolute top-3 right-3">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-2/3 animate-pulse" style={{ animationDelay: '100ms' }} />
          <div className="flex items-center gap-1">
            <Skeleton className="h-4 w-4 rounded-full" style={{ animationDelay: '150ms' }} />
            <Skeleton className="h-4 w-8" style={{ animationDelay: '200ms' }} />
          </div>
        </div>
        <Skeleton className="h-4 w-full mt-2" style={{ animationDelay: '250ms' }} />
        <Skeleton className="h-4 w-3/4" style={{ animationDelay: '300ms' }} />
      </CardHeader>
      
      <CardContent className="space-y-3 flex-grow pt-0">
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2 rounded" style={{ animationDelay: '350ms' }} />
          <Skeleton className="h-4 w-full" style={{ animationDelay: '400ms' }} />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-4 w-4 mr-2 rounded" style={{ animationDelay: '450ms' }} />
          <Skeleton className="h-4 w-24" style={{ animationDelay: '500ms' }} />
        </div>
        
        <div className="flex flex-wrap gap-1 mt-4">
          <Skeleton className="h-6 w-16 rounded-full" style={{ animationDelay: '550ms' }} />
          <Skeleton className="h-6 w-20 rounded-full" style={{ animationDelay: '600ms' }} />
          <Skeleton className="h-6 w-14 rounded-full" style={{ animationDelay: '650ms' }} />
        </div>
      </CardContent>
      
      <div className="p-6 pt-0">
        <Skeleton className="h-10 w-full rounded-lg" style={{ animationDelay: '700ms' }} />
      </div>
    </Card>
  );
};

export default StoreSkeleton;
