
import React from 'react';
import { Routes } from 'react-router-dom';
import { PublicRoutes } from './public';
import { AuthRoutes } from './auth';
import { ProtectedRoutes } from './protected';
import { SellerRoutes } from './seller';
import { AdminRoutes } from './admin';
import RouteSEO from '@/components/routing/RouteSEO';

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
