
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import { useMemo } from 'react';

export const useOptimizedAdminAccess = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  
  // Кэшируем результат проверки прав
  const adminAccessState = useMemo(() => {
    const isLoading = authLoading || profileLoading;
    const isAdmin = profile?.user_type === 'admin';
    
    return {
      isAdmin,
      isCheckingAdmin: isLoading,
      hasAdminAccess: isAdmin
    };
  }, [authLoading, profileLoading, profile?.user_type]);
  
  return adminAccessState;
};
