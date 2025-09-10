import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';

export function useWakeUpHandler() {
  useEffect(() => {
    let timeout: any;
    let isHealing = false; // Prevent multiple concurrent heals
    
    const debounce = (fn: () => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(fn, 350);
    };
    
    const heal = async () => {
      if (isHealing) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Heal already in progress, skipping');
        }
        return;
      }
      
      isHealing = true;
      
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          isHealing = false;
          return;
        }
        
        // Check token expiration before refresh
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = data.session.expires_at || 0;
        
        // Proactive refresh 5 minutes before expiration
        if (expiresAt - now < 300) {
          if (FLAGS.DEBUG_AUTH) {
            console.debug('[WAKE] Token expires soon, proactively refreshing');
          }
          
          await supabase.auth.refreshSession().catch((error) => {
            console.warn('[WAKE] Proactive refresh failed:', error);
          });
        } else {
          // Normal refresh for session validation
          await supabase.auth.refreshSession().catch(() => {});
        }
        
        const s2 = (await supabase.auth.getSession()).data.session;
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Session heal completed:', {
            hasNewSession: !!s2,
            expiresIn: s2?.expires_at ? s2.expires_at - now : 'unknown'
          });
        }
        
      } catch (error) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Heal failed:', error);
        }
        
        // Handle specific error cases
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('refresh_token_not_found')) {
          console.warn('🚨 [WAKE] Invalid refresh token detected, may need re-authentication');
        }
      } finally {
        isHealing = false;
      }
    };

    const debouncedHeal = () => debounce(heal);
    
    // Enhanced event listeners for mobile PWA support
    document.addEventListener('visibilitychange', debouncedHeal);
    window.addEventListener('focus', debouncedHeal);
    window.addEventListener('online', debouncedHeal);
    window.addEventListener('pageshow', debouncedHeal); // Mobile PWA resume
    window.addEventListener('resume', debouncedHeal);   // Cordova/mobile apps
    
    // PWA-specific: periodic token check every 15 minutes (optimized)
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window as any).navigator?.standalone === true;
                  
    let intervalId: any;
    if (isPWA) {
      intervalId = setInterval(() => {
        if (!document.hidden) { // Only when app is visible
          heal();
        }
      }, 15 * 60 * 1000); // 15 minutes - optimized frequency
      
      if (FLAGS.DEBUG_AUTH) {
        console.debug('[WAKE] PWA mode detected, enabled periodic token checks (15min intervals)');
      }
    }
    
    return () => {
      clearTimeout(timeout);
      if (intervalId) clearInterval(intervalId);
      
      document.removeEventListener('visibilitychange', debouncedHeal);
      window.removeEventListener('focus', debouncedHeal);
      window.removeEventListener('online', debouncedHeal);
      window.removeEventListener('pageshow', debouncedHeal);
      window.removeEventListener('resume', debouncedHeal);
    };
  }, []);
}