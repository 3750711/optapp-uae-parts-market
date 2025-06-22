
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { isAdmin, profile } = useAuth();
  
  return useMemo(() => ({
    // Строгая проверка админских прав
    isAdmin: isAdmin === true,
    
    // Проверка в процессе загрузки
    isCheckingAdmin: isAdmin === null,
    
    // Функция для проверки возможности просмотра статуса продукта
    canViewProductStatus: (status: string) => {
      // Админы могут видеть все статусы продуктов
      if (isAdmin === true) {
        return true;
      }
      
      // Не-админы могут видеть только активные или проданные товары
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
  }), [isAdmin, profile?.user_type]);
};
