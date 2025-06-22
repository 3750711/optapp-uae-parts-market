
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';

export const useOptimizedProfiles = (filters: any = {}) => {
  const { user, isAdmin } = useAuth();

  return useQuery({
    queryKey: ['profiles', filters],
    queryFn: async () => {
      if (!isAdmin) throw new Error('Access denied');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user && isAdmin,
  });
};
