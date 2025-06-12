
import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  // Мемоизируем состояние для избежания лишних ре-рендеров
  const authState = useMemo(() => ({
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading,
    isAdmin,
    userType: profile?.user_type,
    userId: user?.id,
    userEmail: user?.email
  }), [user, profile, isLoading, isAdmin]);

  console.log('🔍 AdminRoute state:', authState);

  // Состояние загрузки
  if (authState.isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
          {authState.userEmail && (
            <p className="text-xs text-gray-500 mt-2">
              Пользователь: {authState.userEmail}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Не авторизован - перенаправляем на логин с сохранением текущего пути
  if (!authState.hasUser) {
    console.log('❌ User not authenticated, redirecting to login');
    const redirectPath = location.pathname !== '/login' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectPath}`} replace />;
  }

  // Нет профиля - показываем ошибку с возможностью повторной попытки
  if (!authState.hasProfile) {
    console.log('❌ Profile not found for user:', authState.userId);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки профиля пользователя.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                ID пользователя: {authState.userId}
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Перезагрузить
            </Button>
            <Button 
              onClick={() => window.location.href = '/profile'}
              className="flex-1"
            >
              Профиль
            </Button>
          </div>
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
                <br />
                Email: {authState.userEmail}
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
              В профиль
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // isAdmin === null - ждем проверки прав
  if (authState.isAdmin === null) {
    console.log('⏳ Waiting for admin rights check...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Определение прав доступа...</p>
          <p className="text-xs text-gray-500 mt-2">
            Пользователь: {profile?.email}
            <br />
            Тип: {authState.userType}
          </p>
        </div>
      </div>
    );
  }

  // isAdmin === true - показываем контент
  console.log('✅ Admin access granted');
  return <>{children}</>;
};
