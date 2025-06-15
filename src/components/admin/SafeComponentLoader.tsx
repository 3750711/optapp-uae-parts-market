
import React, { Suspense, ErrorBoundary } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';

interface SafeComponentLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorMessage?: string;
}

const DefaultLoadingSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
);

export const SafeComponentLoader: React.FC<SafeComponentLoaderProps> = ({
  children,
  fallback,
  loadingComponent = <DefaultLoadingSkeleton />,
  errorMessage = "Ошибка загрузки компонента"
}) => {
  return (
    <AdminErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 text-center text-red-600 border border-red-200 rounded-lg bg-red-50">
            {errorMessage}. Попробуйте обновить страницу.
          </div>
        )
      }
    >
      <Suspense fallback={loadingComponent}>
        {children}
      </Suspense>
    </AdminErrorBoundary>
  );
};
