// Realtime protection utilities for preventing cascade failures
let lastTokenHash = '';
let lastSetAt = 0;
const TOKEN_DEBOUNCE_MS = 2000;

// Simple token hash function
function hashToken(token?: string): string {
  if (!token) return '';
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) | 0;
  }
  return String(hash);
}

/**
 * Debounce realtime token updates to prevent cascade failures
 * Only returns true if token actually changed or enough time passed
 */
export function shouldUpdateRtToken(token?: string): boolean {
  const now = Date.now();
  const tokenHash = hashToken(token);
  
  // If same token and not enough time passed, skip update
  if (tokenHash === lastTokenHash && now - lastSetAt < TOKEN_DEBOUNCE_MS) {
    return false;
  }
  
  lastTokenHash = tokenHash;
  lastSetAt = now;
  return true;
}

export type RtMode = 'on' | 'degraded' | 'off';

export interface CircuitBreakerState {
  mode: RtMode;
  failureCount: number;
  lastFailure: number;
}

/**
 * Circuit breaker for Realtime connections
 * Prevents cascade failures by degrading service gracefully
 */
export function createCircuitBreaker(
  failureThreshold = 3,
  windowMs = 120_000
) {
  let failureCount = 0;
  let lastFailure = 0;
  let mode: RtMode = 'on';

  return {
    get mode() { return mode; },
    get state(): CircuitBreakerState {
      return { mode, failureCount, lastFailure };
    },

    reset() {
      failureCount = 0;
      lastFailure = 0;
      if (mode !== 'off') {
        mode = 'on';
      }
    },

    noteSuccess() {
      // On success, reset if we were in degraded mode
      if (mode === 'degraded') {
        failureCount = 0;
        mode = 'on';
      }
    },

    noteFailure(): CircuitBreakerState {
      const now = Date.now();
      
      // Reset counter if window expired
      if (now - lastFailure > windowMs) {
        failureCount = 0;
      }
      
      failureCount++;
      lastFailure = now;
      
      // State transitions
      if (failureCount === 1 && mode === 'on') {
        mode = 'degraded';
      } else if (failureCount >= failureThreshold) {
        mode = 'off';
      }
      
      return { mode, failureCount, lastFailure };
    }
  };
}

/**
 * Check if Realtime should be disabled via kill-switch
 */
export function isRealtimeDisabled(): boolean {
  // Check URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('rt') === 'off') {
    return true;
  }
  
  // Check localStorage flag
  if (localStorage.getItem('PB_RT_OFF') === '1') {
    return true;
  }
  
  return false;
}

/**
 * Safe wrapper for realtime setAuth to prevent crashes
 */
export function safeSetRealtimeAuth(supabase: any, token?: string): boolean {
  try {
    if (!shouldUpdateRtToken(token)) {
      return false; // Skipped due to debounce
    }
    
    supabase.realtime.setAuth(token || '');
    return true; // Successfully updated
  } catch (error) {
    console.warn('⚠️ [RealtimeGuard] Failed to set realtime auth:', error);
    return false;
  }
}