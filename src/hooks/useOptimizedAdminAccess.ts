
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/OptimizedAuthContext';
import { devLog } from '@/utils/performanceUtils';

export const useOptimizedAdminAccess = (userId?: string) => {
  const { user, profile, isLoading: authLoading, isAdmin } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  // Используем данные из AuthContext напрямую
  const currentUserId = userId || user?.id;
  const hasAdminAccess = isAdmin === true;

  useEffect(() => {
    devLog('useOptimizedAdminAccess: Auth state changed', {
      authLoading,
      hasUser: !!user,
      hasProfile: !!profile,
      isAdmin,
      currentUserId
    });

    if (!authLoading) {
      setIsInitializing(false);
      
      if (!user) {
        setInitializationError('Необходима авторизация');
      } else if (!profile) {
        setInitializationError('Не удалось загрузить профиль пользователя');
      } else if (!hasAdminAccess) {
        setInitializationError('Недостаточно прав для доступа к этой странице');
      } else {
        setInitializationError(null);
      }
    }
  }, [authLoading, user, profile, isAdmin, hasAdminAccess]);

  return {
    hasAdminAccess,
    isInitializing: authLoading || isInitializing,
    initializationError
  };
};
