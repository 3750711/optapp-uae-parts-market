
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { isAdmin, profile } = useAuth();
  
  console.log('🔍 useAdminAccess:', { isAdmin, userType: profile?.user_type });
  
  return {
    // Строгая проверка админских прав
    isAdmin: isAdmin === true,
    
    // Функция для проверки возможности просмотра статуса продукта
    canViewProductStatus: (status: string) => {
      // Админы могут видеть все статусы продуктов
      if (isAdmin === true) {
        return true;
      }
      
      // Не-админы могут видеть только активные или проданные товары
      // если они не являются продавцом этого товара
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
    }
  };
};
