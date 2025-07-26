import React, { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import SellerPageSkeleton from '@/components/seller/SellerPageSkeleton';

interface FastProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const FastProtectedRoute: React.FC<FastProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, profile } = useAuth();

  // Fast path for authenticated users with cached profile
  if (user && profile?.user_type && allowedRoles.includes(profile.user_type)) {
    return (
      <Suspense fallback={<SellerPageSkeleton />}>
        {children}
      </Suspense>
    );
  }

  // Fast redirect for unauthenticated users
  if (!user) {
    return <Navigate to="/seller/login" replace />;
  }

  // Loading state for profile check
  if (!profile) {
    return <SellerPageSkeleton />;
  }

  // Access denied
  return <Navigate to="/seller/login" replace />;
};

export default FastProtectedRoute;