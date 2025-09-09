import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Enhanced auth error handler that tries refresh before logout
 * Replaces custom "smart" logout logic with standard Supabase patterns
 */
export async function handleAuthError(error: any, context: string = 'unknown'): Promise<boolean> {
  // Network errors - don't logout
  if (isNetworkError(error)) {
    console.warn(`[AUTH] Network error in ${context}:`, error);
    return true; // Handled, don't propagate
  }

  // Auth errors (401/403) - try refresh first
  if (isAuthError(error)) {
    console.warn(`[AUTH] Auth error in ${context}, attempting refresh:`, error);
    
    try {
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('[AUTH] Refresh failed, signing out:', refreshError);
        await supabase.auth.signOut();
        toast.error('Session expired. Please log in again.');
        return true;
      }
      
      console.log('[AUTH] Session refreshed successfully');
      return true; // Successfully refreshed
    } catch (refreshError) {
      console.error('[AUTH] Refresh attempt failed:', refreshError);
      await supabase.auth.signOut();
      toast.error('Session expired. Please log in again.');
      return true;
    }
  }

  return false; // Not handled, let caller handle
}

// Utility for handling authentication errors softly
// Prevents aggressive signOut on temporary network issues

export const isAuthError = (error: any): boolean => {
  return error?.status === 401 || 
         error?.code === 401 ||
         /invalid.*token/i.test(error?.message) ||
         /unauthorized/i.test(error?.message) ||
         /refresh.*token.*invalid/i.test(error?.message) ||
         /jwt.*expired/i.test(error?.message);
};

export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('Network request failed') ||
         error?.message?.includes('timeout') ||
         error?.code === 'NETWORK_ERROR' ||
         !navigator.onLine;
};

export const handleAuthErrorSoftly = (error: any, context: string = 'unknown') => {
  if (isAuthError(error)) {
    console.warn(`[auth] Soft auth error in ${context}, scheduling refresh:`, error.message);
    
    // Show user-friendly message for token errors
    if (/refresh.*token.*invalid/i.test(error?.message)) {
      toast.error('Session expired. Please sign in again.');
      // Force page reload to trigger re-authentication
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      return true;
    }
    
    // Don't signOut immediately - let the manual refresh system handle it
    setTimeout(() => {
      // The manual refresh system will attempt to refresh the token
      // If it fails repeatedly, the session will naturally expire
      console.log(`[auth] Scheduled refresh attempt for ${context}`);
    }, 1000);
    
    return true; // Indicates this was handled as an auth error
  }
  
  if (isNetworkError(error)) {
    console.warn(`[auth] Network error in ${context}, will retry:`, error.message);
    // Don't show error toast for network issues, they're temporary
    return true;
  }
  
  return false; // Not an auth error, handle normally
};

// Exponential backoff utility for retries
export const createExponentialBackoff = (maxRetries: number = 3, baseDelay: number = 1000) => {
  return {
    shouldRetry: (attemptCount: number, error: any) => {
      if (attemptCount >= maxRetries) return false;
      if (isAuthError(error) && !/refresh.*token.*invalid/i.test(error?.message)) return true;
      if (isNetworkError(error)) return true;
      return false;
    },
    getDelay: (attemptCount: number) => {
      return Math.min(baseDelay * Math.pow(2, attemptCount), 30000);
    }
  };
};

// Usage example:
// if (!handleAuthErrorSoftly(error, 'profile_fetch')) {
//   // Handle other types of errors normally
//   throw error;
// }