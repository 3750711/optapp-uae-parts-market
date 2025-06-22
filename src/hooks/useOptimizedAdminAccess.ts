
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useOptimizedAdminAccess = () => {
  const { user, profile, isAdmin } = useAuth();
  
  // Кэшируем результат проверки прав
  const adminAccessState = useMemo(() => {
    const isCheckingAdmin = !profile && !!user;
    
    return {
      isAdmin: isAdmin === true,
      isCheckingAdmin,
      hasAdminAccess: isAdmin === true
    };
  }, [profile, user, isAdmin]);
  
  return adminAccessState;
};
