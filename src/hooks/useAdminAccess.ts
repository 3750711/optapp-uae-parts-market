
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { profile } = useAuth();
  
  // Простая проверка админских прав
  const isAdmin = profile?.user_type === 'admin';
  
  return {
    // Простая проверка админских прав
    isAdmin,
    
    // Простые функции проверки возможностей
    canViewProductStatus: (status: string) => {
      // Админы могут видеть все статусы продуктов
      if (isAdmin) {
        return true;
      }
      
      // Не-админы могут видеть только активные или проданные товары
      return ['active', 'sold'].includes(status);
    },
    
    canManageUsers: () => isAdmin,
    canManageOrders: () => isAdmin,
    canManageProducts: () => isAdmin,
    hasAdminAccess: () => isAdmin
  };
};
