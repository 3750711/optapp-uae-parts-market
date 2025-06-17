
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useOptimizedAdminAccess = () => {
  const { isAdmin, profile } = useAuth();
  
  // Кэшируем результат проверки прав
  const adminAccessState = useMemo(() => {
    return {
      isAdmin: isAdmin === true,
      isCheckingAdmin: isAdmin === null,
      hasAdminAccess: isAdmin === true
    };
  }, [isAdmin]);
  
  return adminAccessState;
};
