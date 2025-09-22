import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  id: string;
  full_name: string;
  opt_id: string;
  is_trusted_seller: boolean;
  user_type: 'admin' | 'seller' | 'buyer';
}

export const useCurrentUserProfile = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ['current-user-profile', userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, opt_id, is_trusted_seller, user_type')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        throw error;
      }

      return data as UserProfile;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};