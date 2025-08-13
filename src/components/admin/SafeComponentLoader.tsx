
import React, { Suspense } from 'react';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { Skeleton } from '@/components/ui/skeleton';
import BrandedLoader from '@/components/loading/BrandedLoader';

interface SafeComponentLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorMessage?: string;
}

const DefaultLoadingSkeleton = () => (
  <BrandedLoader variant="section" />
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
