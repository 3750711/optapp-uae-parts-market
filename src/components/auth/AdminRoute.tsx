
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { devLog } from '@/utils/performanceUtils';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { 
    isChecking, 
    hasAdminAccess, 
    needsLogin, 
    needsProfile, 
    accessDenied 
  } = useAdminGuard(false);

  devLog('AdminRoute render:', {
    isChecking,
    hasAdminAccess,
    needsLogin,
    needsProfile,
    accessDenied
  });

  // Show loading state
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

  // Redirect to login if not authenticated
  if (needsLogin) {
    return <Navigate to="/login" replace />;
  }

  // Show access denied with user-friendly message
  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              У вас нет прав администратора для доступа к этой странице.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.href = '/profile'}
            className="w-full"
          >
            Вернуться в профиль
          </Button>
        </div>
      </div>
    );
  }

  // Show content if all checks pass
  if (hasAdminAccess) {
    return <>{children}</>;
  }

  // Fallback loading state
  return fallback || (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};
