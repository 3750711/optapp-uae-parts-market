
import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthWithProfile } from '@/hooks/useAuthWithProfile';
import { useUserAccess } from '@/hooks/useUserAccess';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { devLog } from '@/utils/logger';

interface AdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, refreshProfile } = useAuthWithProfile();
  const { role, isFirstLoad, isAdmin } = useUserAccess();
  const location = useLocation();

  // Мемоизируем состояние для избежания лишних ре-рендеров
  const authState = useMemo(() => ({
    hasUser: !!user,
    isAdmin,
    role,
    isFirstLoad,
    userId: user?.id,
    userEmail: user?.email
  }), [user, isAdmin, role, isFirstLoad]);

  devLog('🔍 AdminRoute state:', authState);

  // Show spinner only on true first load
  if (authState.isFirstLoad) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав...</p>
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
    devLog('❌ User not authenticated, redirecting to login');
    const redirectPath = location.pathname !== '/login' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectPath}`} replace />;
  }

  // Check admin permissions using cached/JWT/sessionStorage role
  if (!authState.isAdmin) {
    devLog('❌ User does not have admin rights:', authState.role);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              У вас нет прав администратора для доступа к этой странице.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Тип пользователя: {authState.role || 'неизвестно'}
                <br />
                Email: {authState.userEmail}
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => refreshProfile()}
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

  // isAdmin === true - показываем контент
  devLog('✅ Admin access granted');
  return <>{children}</>;
};
