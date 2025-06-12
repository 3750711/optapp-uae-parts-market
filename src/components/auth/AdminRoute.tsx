
import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
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
  const { user, profile, isLoading, isAdmin, refreshAdminStatus } = useAuth();

  // Мемоизируем состояние для избежания лишних ре-рендеров
  const authState = useMemo(() => ({
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading,
    isAdmin,
    userType: profile?.user_type
  }), [user, profile, isLoading, isAdmin]);

  console.log('🔍 AdminRoute state:', authState);

  // Состояние загрузки - используем простой spinner без timeout
  if (authState.isLoading) {
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
  if (!authState.hasUser) {
    console.log('❌ User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Нет профиля - показываем ошибку
  if (!authState.hasProfile) {
    console.log('❌ Profile not found');
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

  // Проверка админских прав
  if (authState.isAdmin === false) {
    console.log('❌ User does not have admin rights:', authState.userType);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              У вас нет прав администратора для доступа к этой странице.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Тип пользователя: {authState.userType || 'неизвестно'}
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => refreshAdminStatus()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Проверить снова
            </Button>
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="flex-1"
            >
              Вернуться в профиль
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // isAdmin === null - ждем проверки прав (но без отдельного состояния загрузки)
  if (authState.isAdmin === null) {
    console.log('⏳ Waiting for admin rights check...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Определение прав доступа...</p>
          <p className="text-xs text-gray-500 mt-2">
            Пользователь: {profile?.email}
          </p>
        </div>
      </div>
    );
  }

  // isAdmin === true - показываем контент
  console.log('✅ Admin access granted');
  return <>{children}</>;
};
