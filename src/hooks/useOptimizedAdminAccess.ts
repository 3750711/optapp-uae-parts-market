
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import { useMemo } from 'react';

export const useOptimizedAdminAccess = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Кэшируем результат проверки прав
  const adminAccessState = useMemo(() => {
    const isAdmin = profile?.user_type === 'admin';
    const isCheckingAdmin = !profile && !!user;
    
    return {
      isAdmin,
      isCheckingAdmin,
      hasAdminAccess: isAdmin
    };
  }, [profile, user]);
  
  return adminAccessState;
};
