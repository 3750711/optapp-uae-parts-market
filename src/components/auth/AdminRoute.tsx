
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Loader2 } from 'lucide-react';
import { AdminErrorBoundary } from '@/components/error/AdminErrorBoundary';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAdmin, isChecking, hasAdminAccess } = useAdminGuard(false);

  if (isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <AdminErrorBoundary>
      {children}
    </AdminErrorBoundary>
  );
};
