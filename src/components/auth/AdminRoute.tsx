
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, profile, isLoading, isAdmin } = useAuth();

  console.log('AdminRoute state:', {
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading,
    isAdmin,
    userType: profile?.user_type
  });

  // Loading state - только если данные действительно загружаются
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // Не авторизован - перенаправляем на логин
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Нет профиля - показываем ошибку (не должно происходить)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки профиля пользователя.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => window.location.reload()}
            className="w-full"
          >
            Перезагрузить страницу
          </Button>
        </div>
      </div>
    );
  }

  // Нет прав администратора
  if (!isAdmin) {
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

  // Все проверки пройдены - показываем контент
  return <>{children}</>;
};
