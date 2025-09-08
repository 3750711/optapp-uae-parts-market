// Session management and cleanup utilities for auth system

import { supabase } from "@/integrations/supabase/client";

interface DecodedToken {
  iss?: string;
  exp?: number;
  aud?: string;
}

// Decode JWT token without verification (for domain checking)
function decodeJWT(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.warn('Failed to decode JWT token:', error);
    return null;
  }
}

// Check if token was issued by current Supabase domain (flexible domain support)
export function isTokenFromCurrentDomain(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded?.iss) return false;
  
  // Get current domain from runtime config or fallback to hardcoded
  let currentDomain = 'https://api.partsbay.ae'; // Default fallback
  
  try {
    // Try to get domain from runtime config if available
    const runtimeConfig = (window as any).__RUNTIME_CONFIG__;
    if (runtimeConfig?.SUPABASE_URL) {
      currentDomain = runtimeConfig.SUPABASE_URL;
    }
  } catch (error) {
    console.warn('Could not get runtime domain, using fallback:', error);
  }
  
  const expectedIssuer = `${currentDomain}/auth/v1`;
  const isValid = decoded.iss === expectedIssuer;
  
  console.log('🔍 Token domain check:', { 
    tokenIssuer: decoded.iss, 
    expectedIssuer,
    currentDomain,
    isValid
  });
  
  return isValid;
}

// Check if session contains old/invalid tokens
export function isSessionValid(session: any): boolean {
  if (!session?.access_token) return false;
  
  try {
    // Check if token is from current domain
    if (!isTokenFromCurrentDomain(session.access_token)) {
      console.warn('🚨 Session has token from different domain');
      return false;
    }
    
    // Check if token is expired
    const decoded = decodeJWT(session.access_token);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      console.warn('🚨 Session token is expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('🚨 Error validating session:', error);
    return false;
  }
}

// Check if error is a network error (enhanced detection)
export function isNetworkError(error: any): boolean {
  if (!navigator.onLine) return true;
  
  const errorString = (error?.message || error?.name || '').toLowerCase();
  const networkIndicators = [
    'networkerror',
    'failed to fetch',
    'network request failed',
    'connection failed',
    'timeout',
    'abort',
    'ns_binding_aborted',
    'net::err_',
    'fetch error',
    'connection refused',
    'connection reset'
  ];
  
  return networkIndicators.some(indicator => errorString.includes(indicator)) ||
         error?.name === 'TypeError' ||
         error?.name === 'AbortError' ||
         error?.status === 0;
}

// Clear all auth-related localStorage data
export function clearAuthStorage(): void {
  console.log('🧹 Clearing all auth storage');
  
  const authKeys = [
    'sb-vfiylfljiixqkjfqubyq-auth-token',
    'supabase.auth.token',
    'sb-auth-token',
  ];
  
  // Clear known auth keys
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
  
  // Clear any keys that contain 'auth' or 'token'
  const allKeys = Object.keys(localStorage);
  allKeys.forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('sb-')) {
      console.log('🧹 Removing auth key:', key);
      localStorage.removeItem(key);
    }
  });
  
  const sessionKeys = Object.keys(sessionStorage);
  sessionKeys.forEach(key => {
    if (key.includes('auth') || key.includes('token') || key.includes('sb-')) {
      console.log('🧹 Removing session auth key:', key);
      sessionStorage.removeItem(key);
    }
  });
}

// Force clean logout with storage clearing
export async function forceCleanLogout(): Promise<void> {
  console.log('🚪 Force clean logout initiated');
  
  try {
    // Clear storage first
    clearAuthStorage();
    
    // Attempt Supabase signOut (may fail, but that's ok)
    await supabase.auth.signOut();
  } catch (error) {
    console.warn('⚠️ Error during force logout (expected):', error);
  }
  
  // Reload page to ensure clean state
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

// Check and cleanup old sessions on app init
export async function validateAndCleanupSession(): Promise<boolean> {
  console.log('🔍 Validating current session');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('✅ No session found');
      return true;
    }
    
    if (!isSessionValid(session)) {
      console.warn('🚨 Invalid session detected, cleaning up');
      await forceCleanLogout();
      return false;
    }
    
    console.log('✅ Session is valid');
    return true;
  } catch (error) {
    if (isNetworkError(error)) {
      console.warn('🌐 Network error during session validation - allowing graceful degradation:', error);
      // Don't force logout on network errors, allow app to work offline/retry
      return true;
    }
    
    console.error('❌ Error validating session:', error);
    return false;
  }
}

// Enhanced retry mechanism for auth operations
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const shouldRetry = isNetworkError(error) && !isLastAttempt;
      
      if (shouldRetry) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`🔄 Auth operation failed (attempt ${attempt}), retrying in ${delay}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ Auth operation failed after ${attempt} attempts:`, error);
        throw error;
      }
    }
  }
  throw new Error('Retry mechanism exhausted');
}

// Check if user needs first login completion
export async function checkFirstLoginCompletion(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('first_login_completed, profile_completed, auth_method')
      .eq('id', userId)
      .single();
      
    if (error || !data) return true; // Assume completed if error
    
    return data.first_login_completed === true && data.profile_completed === true;
  } catch (error) {
    console.warn('Error checking first login completion:', error);
    return true; // Assume completed if error
  }
}