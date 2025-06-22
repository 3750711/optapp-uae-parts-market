import React, { Suspense, lazy } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/SimpleAuthContext';

const SellerStats = lazy(() => import('./SellerStats'));
const SellerListingsContent = lazy(() => import('./SellerListingsContent'));

const OptimizedSellerDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Панель продавца</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Пожалуйста, войдите в систему, чтобы просмотреть панель продавца.</CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Suspense fallback={<Skeleton className="h-24 w-full rounded-md" />}>
        <SellerStats />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-md" />}>
        <SellerListingsContent />
      </Suspense>
    </div>
  );
};

export default OptimizedSellerDashboard;
