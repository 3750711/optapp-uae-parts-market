
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RouteSEO from '@/components/routing/RouteSEO';

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
      <Routes>
        <PublicRoutes />
        <AuthRoutes />
        <ProtectedRoutes />
        <SellerRoutes />
        <AdminRoutes />
      </Routes>
    </>
  );
};

export default AppRoutes;
