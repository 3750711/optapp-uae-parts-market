
import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteSEO from '@/components/routing/RouteSEO';
import { RouteErrorBoundary } from '@/components/routing/RouteErrorBoundary';
import { RouteSuspenseFallback } from '@/components/routing/RouteSuspenseFallback';

// Импортируем все маршруты
import { PublicRoutes } from './public';
import { AuthRoutes } from './auth';
import { ProtectedRoutes } from './protected';
import { SellerRoutes } from './seller';
import { AdminRoutes } from './admin';

const AppRoutes: React.FC = () => {
  return (
    <>
      <RouteSEO />
      <RouteErrorBoundary>
        <Suspense fallback={<RouteSuspenseFallback />}>
          <Routes>
            <PublicRoutes />
            <AuthRoutes />
            <ProtectedRoutes />
            <SellerRoutes />
            <AdminRoutes />
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </>
  );
};

export default AppRoutes;
