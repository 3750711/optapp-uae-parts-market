
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
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
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, refetch } = useProfile();
  const location = useLocation();

  const isLoading = authLoading || profileLoading;
  const isAdmin = profile?.user_type === 'admin';

  console.log('🔍 AdminRoute state:', { 
    hasUser: !!user, 
    hasProfile: !!profile, 
    isLoading, 
    isAdmin,
    userType: profile?.user_type,
    userId: user?.id,
    userEmail: user?.email 
  });

  // Состояние загрузки
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
          {user?.email && (
            <p className="text-xs text-gray-500 mt-2">
              Пользователь: {user.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Не авторизован - перенаправляем на логин
  if (!user) {
    console.log('❌ User not authenticated, redirecting to login');
    const redirectPath = location.pathname !== '/login' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectPath}`} replace />;
  }

  // Нет профиля - показываем ошибку
  if (!profile) {
    console.log('❌ Profile not found for user:', user?.id);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ошибка загрузки профиля пользователя.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                ID пользователя: {user?.id}
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetch()}
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
  if (!isAdmin) {
    console.log('❌ User does not have admin rights:', profile?.user_type);
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              У вас нет прав администратора для доступа к этой странице.
              <br />
              <span className="text-xs text-gray-500 mt-1 block">
                Тип пользователя: {profile?.user_type || 'неизвестно'}
                <br />
                Email: {user?.email}
              </span>
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button 
              onClick={() => refetch()}
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

  // Админ доступ предоставлен
  console.log('✅ Admin access granted');
  return <>{children}</>;
};
