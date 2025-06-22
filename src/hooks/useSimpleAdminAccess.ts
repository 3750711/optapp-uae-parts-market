
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import { useMemo } from 'react';

export const useSimpleAdminAccess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Мемоизируем результат проверки прав для производительности
  const adminAccessState = useMemo(() => {
    const isLoading = authLoading || profileLoading;
    const isAdmin = profile?.user_type === 'admin';
    
    return {
      // Строгая проверка админских прав
      isAdmin: isAdmin === true,
      
      // Проверка в процессе загрузки
      isCheckingAdmin: isLoading,
      
      // Функция для проверки возможности просмотра статуса продукта
      canViewProductStatus: (status: string) => {
        if (isAdmin === true) {
          return true;
        }
        return ['active', 'sold'].includes(status);
      },
      
      // Функция для проверки возможности управления пользователями
      canManageUsers: () => {
        return isAdmin === true;
      },
      
      // Функция для проверки возможности управления заказами
      canManageOrders: () => {
        return isAdmin === true;
      },
      
      // Функция для проверки возможности управления товарами
      canManageProducts: () => {
        return isAdmin === true;
      },
      
      // Функция для проверки доступа к админским функциям
      hasAdminAccess: () => {
        return isAdmin === true;
      }
    };
  }, [authLoading, profileLoading, profile?.user_type]);
  
  return adminAccessState;
};
