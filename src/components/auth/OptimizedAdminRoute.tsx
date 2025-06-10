
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OptimizedAdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const OptimizedAdminRoute: React.FC<OptimizedAdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, profile, isLoading, isAdmin } = useAuth();

  // Показываем загрузку только при первичной инициализации
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Быстрый редирект если не авторизован
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь есть, но профиль еще загружается, показываем компактную загрузку
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Показываем отказ в доступе только если точно известно что не админ
  if (isAdmin === false) {
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

  // Показываем контент если админские права подтверждены
  if (isAdmin === true) {
    return <>{children}</>;
  }

  // Компактная загрузка для пограничных случаев
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
};
