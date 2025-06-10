
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedLoadingStateProps {
  type?: 'page' | 'card' | 'list' | 'compact';
  count?: number;
  className?: string;
}

export const OptimizedLoadingState: React.FC<OptimizedLoadingStateProps> = ({
  type = 'compact',
  count = 1,
  className = "",
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'page':
        return (
          <div className={`space-y-6 ${className}`}>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-64 w-full" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        );
      
      case 'card':
        return (
          <div className={`space-y-4 p-4 border rounded-lg ${className}`}>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        );
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );
      
      case 'compact':
      default:
        return (
          <div className={`flex items-center justify-center p-8 ${className}`}>
            <div className="space-y-3 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Загрузка...</p>
            </div>
          </div>
        );
    }
  };

  return <>{renderSkeleton()}</>;
};

export default OptimizedLoadingState;
