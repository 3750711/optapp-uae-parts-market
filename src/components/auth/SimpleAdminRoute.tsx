
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminRouteProps {
  children: React.ReactNode;
}

export const SimpleAdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, profile, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading while checking auth and profile
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    const redirectPath = location.pathname !== '/login' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectPath}`} replace />;
  }

  // No profile found
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Ошибка загрузки профиля пользователя.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check admin rights
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            У вас нет прав администратора для доступа к этой странице.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Admin access granted
  return <>{children}</>;
};
