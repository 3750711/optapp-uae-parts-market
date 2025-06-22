
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';

export const useSimpleAdminAccess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  const isLoading = authLoading || profileLoading;
  
  // Проверяем админские права через profile.user_type
  const isAdmin = profile?.user_type === 'admin';
  
  return {
    // Строгая проверка админских прав
    isAdmin,
    
    // Проверка в процессе загрузки
    isCheckingAdmin: isLoading,
    
    // Функция для проверки возможности просмотра статуса продукта
    canViewProductStatus: (status: string) => {
      // Админы могут видеть все статусы продуктов
      if (isAdmin) {
        return true;
      }
      
      // Не-админы могут видеть только активные или проданные товары
      return ['active', 'sold'].includes(status);
    },
    
    // Функция для проверки возможности управления пользователями
    canManageUsers: () => {
      return isAdmin;
    },
    
    // Функция для проверки возможности управления заказами
    canManageOrders: () => {
      return isAdmin;
    },
    
    // Функция для проверки возможности управления товарами
    canManageProducts: () => {
      return isAdmin;
    },
    
    // Функция для проверки доступа к админским функциям
    hasAdminAccess: () => {
      return isAdmin;
    }
  };
};
