import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useOptimizedProfile() {
  const { user } = useAuth();
  
  const result = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async ({ signal }) => {
      if (!user?.id) throw new Error('No user ID available');
      
      console.log('🔍 [Profile] Loading profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(signal)
        .single();
      
      if (error) {
        console.error('❌ [Profile] Error loading profile:', error);
        throw error;
      }
      
      console.log('✅ [Profile] Profile loaded successfully for user:', user.id);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data is relatively stable
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false, // Don't refetch on every focus - reduces network requests
    refetchOnReconnect: true, // Still refetch on reconnect for data consistency
    retry: (failureCount, error: any) => {
      // Don't retry AbortError or 4xx errors
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      // Smart retry strategy for network reliability
      return failureCount < 2; // Retry up to 2 times - balanced approach
    },
    retryDelay: (attemptIndex) => Math.min(500 * 2 ** attemptIndex, 5000), // Exponential backoff, faster recovery
  });

  // Handle AbortError logging without onError callback
  if (result.error?.name !== 'AbortError' && result.error) {
    console.warn('[PROFILE_QUERY] Failed to load profile:', result.error);
  }

  return result;
}