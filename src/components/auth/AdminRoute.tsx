
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAdminGuard';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, isLoading: authLoading } = useAuth();
  const { isAdmin, isChecking, hasAdminAccess } = useAdminGuard(false);

  console.log('AdminRoute state:', {
    user: !!user,
    authLoading,
    isChecking,
    isAdmin,
    hasAdminAccess
  });

  // Показываем загрузку пока идет проверка аутентификации или прав админа
  if (authLoading || isChecking) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, редиректим на логин
  if (!user) {
    console.log('AdminRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Если нет прав администратора, редиректим на профиль
  if (!hasAdminAccess) {
    console.log('AdminRoute: No admin access, redirecting to profile');
    return <Navigate to="/profile" replace />;
  }

  // Если все проверки пройдены, рендерим админский контент
  return (
    <AdminErrorBoundary>
      {children}
    </AdminErrorBoundary>
  );
};
