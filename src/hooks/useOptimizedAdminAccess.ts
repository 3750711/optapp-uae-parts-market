
import { useAuth } from '@/contexts/AuthContext';

/**
 * @deprecated Use useAuth() directly for isAdmin and isCheckingAdmin
 * This hook now delegates to the centralized AuthContext
 */
export const useOptimizedAdminAccess = () => {
  const { isAdmin, isCheckingAdmin } = useAuth();
  
  return {
    isAdmin,
    isCheckingAdmin,
    hasAdminAccess: isAdmin
  };
};
