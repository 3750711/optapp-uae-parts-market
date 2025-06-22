
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';

export const useAdminOrderInitialization = () => {
  const { user, isAdmin } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (user && isAdmin) {
      setIsInitialized(true);
    }
  }, [user, isAdmin]);

  return {
    isInitialized,
    user,
    isAdmin
  };
};
