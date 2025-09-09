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
    staleTime: 30000, // 30 seconds - reduced for better responsiveness
    gcTime: 300000, // 5 minutes - keep in cache longer
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: (failureCount, error: any) => {
      // Don't retry AbortError or 4xx errors
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      // Increase retry count for better reliability
      return failureCount < 3; // Retry up to 3 times for network errors
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Handle AbortError logging without onError callback
  if (result.error?.name !== 'AbortError' && result.error) {
    console.warn('[PROFILE_QUERY] Failed to load profile:', result.error);
  }

  return result;
}