
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { devLog } from '@/utils/performanceUtils';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking, hasAdminAccess } = useAdminGuard(false);

  devLog('AdminRoute state:', {
    user: !!user,
    authLoading,
    isChecking,
    isAdmin,
    hasAdminAccess
  });

  // Show loading while checking authentication or admin rights
  if (authLoading || isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    devLog('AdminRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If no admin access, redirect to profile
  if (!hasAdminAccess) {
    devLog('AdminRoute: No admin access, redirecting to profile');
    return <Navigate to="/profile" replace />;
  }

  // If all checks pass, render admin content
  return <>{children}</>;
};
