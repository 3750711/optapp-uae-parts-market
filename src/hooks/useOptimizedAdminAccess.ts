
import { useAuth } from '@/contexts/AuthContext';
import { useMemo } from 'react';

export const useOptimizedAdminAccess = () => {
  const { profile } = useAuth();
  
  // Простое кэширование результата проверки прав
  const adminAccessState = useMemo(() => {
    const isAdmin = profile?.user_type === 'admin';
    
    return {
      isAdmin,
      hasAdminAccess: isAdmin
    };
  }, [profile?.user_type]);
  
  return adminAccessState;
};
