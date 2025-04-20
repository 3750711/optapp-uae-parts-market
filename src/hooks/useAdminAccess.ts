
import { useAuth } from '@/contexts/AuthContext';

export const useAdminAccess = () => {
  const { profile } = useAuth();
  
  return {
    isAdmin: profile?.user_type === 'admin',
  };
};
