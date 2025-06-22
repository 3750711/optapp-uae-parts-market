
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { isAdmin, profile } = useAuth();
  
  return useMemo(() => {
    // Отладочная информация
    console.log('🔍 useAdminAccess Debug:', {
      isAdmin,
      profile_user_type: profile?.user_type,
      profile_exists: !!profile
    });

    // Строгая проверка админских прав с fallback на profile
    const hasAdminRights = isAdmin === true || profile?.user_type === 'admin';
    
    console.log('🔑 Admin rights result:', hasAdminRights);
    
    return {
      // Строгая проверка админских прав
      isAdmin: hasAdminRights,
      
      // Проверка в процессе загрузки
      isCheckingAdmin: isAdmin === null && !profile,
      
      // Функция для проверки возможности просмотра статуса продукта
      canViewProductStatus: (status: string) => {
        // Админы могут видеть все статусы продуктов
        if (hasAdminRights) {
          return true;
        }
        
        // Не-админы могут видеть только активные или проданные товары
        return ['active', 'sold'].includes(status);
      },
      
      // Функция для проверки возможности управления пользователями
      canManageUsers: () => {
        return hasAdminRights;
      },
      
      // Функция для проверки возможности управления заказами
      canManageOrders: () => {
        return hasAdminRights;
      },
      
      // Функция для проверки возможности управления товарами
      canManageProducts: () => {
        return hasAdminRights;
      },
      
      // Функция для проверки доступа к админским функциям
      hasAdminAccess: () => {
        return hasAdminRights;
      }
    };
  }, [isAdmin, profile?.user_type]);
};
