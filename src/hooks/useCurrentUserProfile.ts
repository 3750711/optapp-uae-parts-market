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
      console.log('🔍 Fetching profile for user:', userId);
      
      if (!userId) {
        console.log('❌ No userId available');
        return null;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, opt_id, is_trusted_seller, user_type')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('❌ Error fetching current user profile:', error);
          // Don't throw on "not found" errors, return null instead
          if (error.code === 'PGRST116') {
            console.log('⚠️ Profile not found, returning null');
            return null;
          }
          throw error;
        }

        console.log('✅ Profile loaded successfully:', data);
        return data as UserProfile;
      } catch (error) {
        console.error('💥 Critical error in profile fetch:', error);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on permission errors
      if (error?.code === '42501' || error?.message?.includes('permission')) {
        console.log('🚫 Permission error, not retrying');
        return false;
      }
      return failureCount < 3; // Ограничить до 3 попыток
    },
    retryDelay: (attemptIndex) => {
      // Экспоненциальная задержка: 500ms → 1000ms → 2000ms
      const delays = [500, 1000, 2000];
      return delays[attemptIndex - 1] ?? 2000;
    },
  });
};