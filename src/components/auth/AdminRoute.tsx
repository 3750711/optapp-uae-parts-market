
import React, { useEffect, useState, useMemo } from 'react';
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
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Мемоизируем состояние для избежания лишних ре-рендеров
  const authState = useMemo(() => ({
    hasUser: !!user,
    hasProfile: !!profile,
    isLoading,
    isAdmin,
    userType: profile?.user_type
  }), [user, profile, isLoading, isAdmin]);

  // Уменьшенный timeout до 7 секунд
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        setTimeoutReached(true);
      }, 7000);

      return () => clearTimeout(timeoutId);
    } else {
      setTimeoutReached(false);
    }
  }, [isLoading]);

  // Обработчик повторной попытки
  const handleRetry = () => {
    setTimeoutReached(false);
    refreshAdminStatus();
  };

  // Если достигнут timeout, показываем кнопку повтора
  if (timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Превышено время ожидания загрузки. Попробуйте обновить страницу.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Попробовать снова
          </Button>
        </div>
      </div>
    );
  }

  // Состояние загрузки
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
  if (!authState.hasUser) {
    return <Navigate to="/login" replace />;
  }

  // Нет профиля - показываем ошибку
  if (!authState.hasProfile) {
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

  // isAdmin === null - состояние неопределенности
  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Определение прав доступа...</p>
        </div>
      </div>
    );
  }

  // isAdmin === true - показываем контент
  return <>{children}</>;
};
