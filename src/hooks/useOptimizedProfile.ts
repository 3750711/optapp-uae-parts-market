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
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .abortSignal(signal)
        .single();
      
      if (error) throw error;
      return data;
    },
    staleTime: 60000, // 1 minute - profile data doesn't change often
    gcTime: 300000, // 5 minutes - keep in cache longer
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
    retry: (failureCount, error: any) => {
      // Don't retry AbortError or 4xx errors
      if (error?.name === 'AbortError' || (error?.status >= 400 && error?.status < 500)) {
        return false;
      }
      return failureCount < 1; // Only retry once for network errors
    },
  });

  // Handle AbortError logging without onError callback
  if (result.error?.name !== 'AbortError' && result.error) {
    console.warn('[PROFILE_QUERY] Failed to load profile:', result.error);
  }

  return result;
}