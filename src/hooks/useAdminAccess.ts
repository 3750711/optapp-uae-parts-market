
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook for checking admin access - now delegates to centralized AuthContext
 * @deprecated Use useAuth() directly for isAdmin and isCheckingAdmin
 */
export const useAdminAccess = () => {
  const { isAdmin, isCheckingAdmin } = useAuth();
  
  return {
    isAdmin,
    hasAdminAccess: isAdmin,
    isCheckingAdmin
  };
};
