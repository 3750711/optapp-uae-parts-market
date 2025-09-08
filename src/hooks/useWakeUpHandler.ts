import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useWakeUpHandler() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let timeout: any;
    
    const debounce = (fn: () => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(fn, 350);
    };
    
    const heal = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) return;
        
        await supabase.auth.refreshSession().catch(() => {});
        const s2 = (await supabase.auth.getSession()).data.session;
        if (s2?.access_token) {
          supabase.realtime.setAuth(s2.access_token);
          
          // Invalidate profile using proper queryClient hook
          queryClient.invalidateQueries({ 
            queryKey: ['profile', s2.user.id] 
          });
        }
      } catch (error) {
        console.warn('[WAKE] Heal failed:', error);
      }
    };

    const debouncedHeal = () => debounce(heal);
    
    // Listen to visibility changes and focus events
    document.addEventListener('visibilitychange', debouncedHeal);
    window.addEventListener('focus', debouncedHeal);
    window.addEventListener('online', debouncedHeal);
    
    return () => {
      clearTimeout(timeout);
      document.removeEventListener('visibilitychange', debouncedHeal);
      window.removeEventListener('focus', debouncedHeal);
      window.removeEventListener('online', debouncedHeal);
    };
  }, [queryClient]);
}