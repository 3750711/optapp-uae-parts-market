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
      if (!isMounted || isHealing) return;
      
      isHealing = true;
      
      try {
        // Просто вызываем refreshSession - Supabase сам решит нужно ли обновлять
        await supabase.auth.refreshSession();
        errorCount = 0;
        
        if (FLAGS.DEBUG_AUTH) {
          console.debug('[WAKE] Session refresh completed');
        }
      } catch (error) {
        // Только логируем, не делаем агрессивных действий
        if (FLAGS.DEBUG_AUTH) {
          console.warn('[WAKE] Refresh failed:', error);
        }
        errorCount++;
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
      }, 30 * 60 * 1000); // 30 minutes - optimized frequency
      
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