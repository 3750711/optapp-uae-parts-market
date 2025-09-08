import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';

export function useWakeUpHandler() {
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
        
        // Simple session refresh - React Query handles data refetching via refetchOnWindowFocus
        await supabase.auth.refreshSession().catch(() => {});
        const s2 = (await supabase.auth.getSession()).data.session;
        
        // Only update realtime auth if enabled
        if (s2?.access_token && FLAGS.REALTIME_ENABLED) {
          supabase.realtime.setAuth(s2.access_token);
        }
      } catch (error) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Heal failed:', error);
        }
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
  }, []);
}