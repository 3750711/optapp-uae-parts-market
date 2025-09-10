import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { FLAGS } from '@/config/flags';

export function useWakeUpHandler() {
  useEffect(() => {
    let timeout: any;
    let retryTimeout: any; // Separate timeout for retries
    let isHealing = false; // Prevent multiple concurrent heals
    let errorCount = 0; // Circuit breaker error counter
    let lastActivity = Date.now(); // Activity tracking for throttling
    let isMounted = true; // CRITICAL: Prevent memory leaks after unmount
    
    const debounce = (fn: () => void) => {
      clearTimeout(timeout);
      timeout = setTimeout(fn, 350);
    };
    
    // Throttled activity tracking (only update every 30 seconds)
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastActivity > 30000) {
        lastActivity = now;
      }
    };
    
    const heal = async () => {
      if (!isMounted || isHealing) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Heal already in progress or unmounted, skipping');
        }
        return;
      }
      
      // Circuit breaker: stop trying after 3 consecutive failures
      if (errorCount >= 3) {
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Circuit breaker active, skipping heal');
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
        
        // Proactive refresh 10 minutes before expiration (increased buffer)
        if (expiresAt - now < 600) {
          if (FLAGS.DEBUG_AUTH) {
            console.debug('[WAKE] Token expires soon, proactively refreshing');
          }
          
          await supabase.auth.refreshSession().catch((error) => {
            console.warn('[WAKE] Proactive refresh failed:', error);
            throw error; // Re-throw to trigger circuit breaker
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
        
        // Reset error count on success
        errorCount = 0;
        
      } catch (error) {
        errorCount++;
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Heal failed:', error, `(errors: ${errorCount}/3)`);
        }
        
        // Handle specific error cases
        if (error?.message?.includes('Invalid Refresh Token') || 
            error?.message?.includes('refresh_token_not_found')) {
          console.warn('🚨 [WAKE] Invalid refresh token detected, may need re-authentication');
        }
        
        // Exponential backoff with jitter for failed requests
        if (errorCount < 3) {
          const baseDelay = Math.min(1000 * Math.pow(2, errorCount - 1), 60000); // 1s, 2s, 4s, max 60s
          const jitter = Math.random() * 1000; // Add up to 1s jitter
          const delay = baseDelay + jitter;
          
          if (FLAGS.DEBUG_AUTH) {
            console.debug(`[WAKE] Scheduling retry in ${Math.round(delay)}ms`);
          }
          
          retryTimeout = setTimeout(() => {
            if (isMounted && errorCount < 3) heal(); // CRITICAL: Check isMounted
          }, delay);
        }
      } finally {
        isHealing = false;
      }
    };

    const debouncedHeal = () => {
      updateActivity();
      debounce(heal);
    };
    
    // Optimized event listeners for mobile PWA support (removed 'resume' - was causing issues)
    document.addEventListener('visibilitychange', debouncedHeal);
    window.addEventListener('focus', debouncedHeal);
    window.addEventListener('online', debouncedHeal);
    window.addEventListener('pageshow', debouncedHeal); // Mobile PWA resume
    
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
      isMounted = false; // CRITICAL: Prevent memory leaks
      clearTimeout(timeout);
      clearTimeout(retryTimeout); // CRITICAL: Clear retry timeout
      if (intervalId) clearInterval(intervalId);
      
      document.removeEventListener('visibilitychange', debouncedHeal);
      window.removeEventListener('focus', debouncedHeal);
      window.removeEventListener('online', debouncedHeal);
      window.removeEventListener('pageshow', debouncedHeal);
    };
  }, []);
}