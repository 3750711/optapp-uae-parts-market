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
  
  // List of allowed domains for flexible development/preview support
  const allowedDomains = [
    'https://api.partsbay.ae', // Production
    'https://vfiylfljiixqkjfqubyq.supabase.co', // Direct Supabase URL
  ];
  
  // Add current window location domain for development/preview
  if (typeof window !== 'undefined') {
    const windowDomain = currentDomain;
    if (!allowedDomains.includes(windowDomain)) {
      allowedDomains.push(windowDomain);
    }
  }
  
  // Check if token issuer matches any allowed domain
  const isValid = allowedDomains.some(domain => {
    const expectedIssuer = `${domain}/auth/v1`;
    return decoded.iss === expectedIssuer;
  });
  
  console.log('🔍 Token domain check (flexible):', { 
    tokenIssuer: decoded.iss, 
    allowedDomains,
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
    'ns_binding_aborted', // Added explicit handling for NS_BINDING_ABORTED
    'net::err_',
    'fetch error',
    'connection refused',
    'connection reset',
    'timeouterror' // Added TimeoutError handling
  ];
  
  // Special handling for NS_BINDING_ABORTED - this is a critical network interruption
  const isBindingAborted = errorString.includes('ns_binding_aborted') || 
                          errorString.includes('binding_aborted') ||
                          error?.code === 'NS_BINDING_ABORTED';
  
  return networkIndicators.some(indicator => errorString.includes(indicator)) ||
         error?.name === 'TypeError' ||
         error?.name === 'AbortError' ||
         error?.name === 'TimeoutError' ||
         error?.status === 0 ||
         isBindingAborted;
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

// Enhanced retry mechanism for auth operations with special NS_BINDING_ABORTED handling
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
      const isNetworkErr = isNetworkError(error);
      
      // Special handling for NS_BINDING_ABORTED - increase retry attempts
      const errorString = (error?.message || error?.name || '').toLowerCase();
      const isBindingAborted = errorString.includes('ns_binding_aborted') || 
                              errorString.includes('binding_aborted');
      
      // For NS_BINDING_ABORTED, allow more retries with longer delays
      const effectiveMaxRetries = isBindingAborted ? Math.max(maxRetries, 5) : maxRetries;
      const effectiveIsLastAttempt = attempt >= effectiveMaxRetries;
      const shouldRetry = isNetworkErr && !effectiveIsLastAttempt;
      
      if (shouldRetry) {
        // Longer delay for binding aborted errors
        const multiplier = isBindingAborted ? 3 : 2;
        const delay = baseDelay * Math.pow(multiplier, attempt - 1);
        
        console.log(`🔄 Auth operation failed (attempt ${attempt}/${effectiveMaxRetries}), retrying in ${delay}ms:`, {
          error: error?.message || error,
          isBindingAborted,
          delay
        });
        
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`❌ Auth operation failed after ${attempt} attempts:`, error);
        throw error;
      }
    }
  }
  throw new Error('Retry mechanism exhausted');
}

// Check if user needs first login completion (DISABLED - always returns true)
export async function checkFirstLoginCompletion(userId: string): Promise<boolean> {
  // DISABLED: Always return true to skip first login completion checks
  console.log('🔄 First login completion check disabled - returning true for user:', userId);
  return true;
}