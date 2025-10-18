
import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user, isAdmin, isCheckingAdmin, profile, loading } = useAuth();
  const location = useLocation();

  // Мемоизируем состояние для избежания лишних ре-рендеров
  const authState = useMemo(() => ({
    hasUser: !!user,
    isAdmin,
    role: profile?.user_type,
    isCheckingAdmin,
    loading,
    userId: user?.id,
    userEmail: user?.email
  }), [user, isAdmin, isCheckingAdmin, profile, loading]);

  devLog('🔍 AdminRoute state:', authState);

  // Show loading while auth is initializing or checking admin status
  if (authState.loading || authState.isCheckingAdmin) {
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
  // Но только если не идет загрузка
  if (!authState.hasUser && !authState.loading) {
    devLog('❌ User not authenticated, redirecting to login');
    const redirectPath = location.pathname !== '/login' ? `?from=${encodeURIComponent(location.pathname)}` : '';
    return <Navigate to={`/login${redirectPath}`} replace />;
  }

  // Check admin permissions - redirect to /403 if not admin
  if (!authState.isAdmin) {
    devLog('❌ User does not have admin rights:', authState.role);
    return <Navigate to="/403" replace />;
  }

  // isAdmin === true - показываем контент
  devLog('✅ Admin access granted');
  return <>{children}</>;
};
