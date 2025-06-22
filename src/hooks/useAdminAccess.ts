
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { isAdmin, user, profile } = useAuth();
  
  return {
    isAdmin: isAdmin === true,
    hasAdminAccess: isAdmin === true,
    isCheckingAdmin: isAdmin === null && !!user
  };
};
