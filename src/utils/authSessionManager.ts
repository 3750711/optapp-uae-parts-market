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

// Check if token was issued by current Supabase domain (enhanced preview environment support)
export function isTokenFromCurrentDomain(token: string): boolean {
  try {
    const decoded = decodeJWT(token);
    if (!decoded?.iss) {
      console.warn('🔍 Token missing issuer claim');
      return false;
    }
    
    // Get current domain from runtime config or fallback
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
    
    // Check if we're in a preview environment
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview') ||
                        window.location.hostname.includes('localhost') ||
                        window.location.hostname.includes('127.0.0.1');
    
    // List of allowed domains for flexible development/preview support
    const allowedDomains = [
      'https://api.partsbay.ae', // Production
      'https://vfiylfljiixqkjfqubyq.supabase.co', // Direct Supabase URL
    ];
    
    // Add current window location domain for development/preview
    if (typeof window !== 'undefined') {
      if (!allowedDomains.includes(currentDomain)) {
        allowedDomains.push(currentDomain);
      }
    }
    
    // Check if token issuer matches any allowed domain
    const isValid = allowedDomains.some(domain => {
      const expectedIssuer = `${domain}/auth/v1`;
      return decoded.iss === expectedIssuer;
    });
    
    console.log('🔍 Enhanced token domain check:', { 
      tokenIssuer: decoded.iss, 
      allowedDomains,
      currentDomain,
      isPreviewEnv,
      isValid,
      windowLocation: window.location.origin
    });
    
    // In preview environments, be more lenient if the basic check fails
    if (!isValid && isPreviewEnv) {
      // Check if issuer contains reasonable Supabase-like patterns
      const hasSupabasePattern = decoded.iss.includes('supabase') || 
                                decoded.iss.includes('partsbay') ||
                                decoded.iss.includes('/auth/v1');
      
      console.log('🔍 Preview env fallback check:', {
        hasSupabasePattern,
        reasoning: 'More flexible validation in preview environment'
      });
      
      return hasSupabasePattern;
    }
    
    return isValid;
  } catch (error) {
    console.warn('🔍 Error checking token domain:', error);
    
    // In preview environments, don't fail on parsing errors
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview');
    if (isPreviewEnv) {
      console.log('🔍 Allowing token in preview env despite parsing error');
      return true;
    }
    
    return false;
  }
}

// Check if session contains old/invalid tokens (enhanced preview environment support)
export function isSessionValid(session: any): boolean {
  if (!session?.access_token) return false;
  
  try {
    // Check if we're in a preview environment
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview') ||
                        window.location.hostname.includes('localhost') ||
                        window.location.hostname.includes('127.0.0.1');
    
    // Check if token is from current domain (be more lenient in preview)
    const domainValid = isTokenFromCurrentDomain(session.access_token);
    if (!domainValid) {
      if (isPreviewEnv) {
        console.warn('🚨 Session has token from different domain, but allowing in preview environment');
        // Don't reject - continue with other validations
      } else {
        console.warn('🚨 Session has token from different domain');
        return false;
      }
    }
    
    // Check if token is expired
    const decoded = decodeJWT(session.access_token);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      console.warn('🚨 Session token is expired');
      return false;
    }
    
    console.log('✅ Session validation passed:', {
      hasAccessToken: !!session.access_token,
      domainValid,
      isPreviewEnv,
      tokenExpiry: decoded?.exp ? new Date(decoded.exp * 1000) : 'none'
    });
    
    return true;
  } catch (error) {
    console.warn('🚨 Error validating session:', error);
    
    // In preview environments, be more forgiving of validation errors
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview');
    if (isPreviewEnv) {
      console.log('🔧 Session validation error in preview env, allowing to continue');
      return true;
    }
    
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

// Enhanced session validation with preview environment support  
export async function validateAndCleanupSession(): Promise<boolean> {
  console.log('🔍 Validating current session');
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('🔧 Session validation error:', error);
      
      // In preview environments, be more forgiving of network errors
      const isPreviewEnv = window.location.hostname.includes('lovable') || 
                          window.location.hostname.includes('preview');
      
      if (isPreviewEnv && isNetworkError(error)) {
        console.log('🔧 Network error in preview env, allowing session to continue');
        return true; // Don't force logout on network errors in preview
      }
      
      await forceCleanLogout();
      return false;
    }
    
    if (!session) {
      console.log('✅ No session found during validation');
      return true; // No session is valid state
    }
    
    const isValid = isSessionValid(session);
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview');
    
    console.log('🔧 Session validation result:', {
      isValid,
      isPreviewEnv,
      sessionExists: !!session,
      accessToken: session.access_token ? 'present' : 'missing',
      user: session.user ? 'present' : 'missing'
    });
    
    if (!isValid) {
      if (isPreviewEnv) {
        console.warn('🔧 Session appears invalid but allowing in preview environment');
        return true; // Be more lenient in preview environments
      }
      
      console.warn('🚨 Invalid session detected, cleaning up');
      await forceCleanLogout();
      return false;
    }
    
    console.log('✅ Session validation passed');
    return true;
  } catch (error) {
    console.error('🔧 Error during session validation:', error);
    
    // In preview environments, don't force logout on validation errors
    const isPreviewEnv = window.location.hostname.includes('lovable') || 
                        window.location.hostname.includes('preview');
    
    if (isPreviewEnv) {
      console.log('🔧 Session validation error in preview env, allowing to continue');
      return true;
    }
    
    if (isNetworkError(error)) {
      console.warn('🌐 Network error during session validation - allowing graceful degradation:', error);
      // Don't force logout on network errors, allow app to work offline/retry
      return true;
    }
    
    console.error('❌ Critical session validation error, forcing logout');
    await forceCleanLogout();
    return false;
  }
}

// Enhanced retry mechanism for auth operations with Firefox and preview environment support
export async function retryAuthOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  // Detect Firefox for special handling
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isPreviewEnv = window.location.hostname.includes('lovable') || 
                      window.location.hostname.includes('preview');
  
  // More retries for Firefox and preview environments
  const effectiveMaxRetries = (isFirefox || isPreviewEnv) ? Math.max(maxRetries, 5) : maxRetries;

  for (let attempt = 1; attempt <= effectiveMaxRetries; attempt++) {
    try {
      console.log(`🔄 Auth operation attempt ${attempt}/${effectiveMaxRetries} ${isFirefox ? '(Firefox)' : ''} ${isPreviewEnv ? '(Preview)' : ''}`);
      return await operation();
    } catch (error) {
      const isLastAttempt = attempt === effectiveMaxRetries;
      const isNetworkErr = isNetworkError(error);
      
      // Special handling for NS_BINDING_ABORTED - increase retry attempts
      const errorString = (error?.message || error?.name || '').toLowerCase();
      const isBindingAborted = errorString.includes('ns_binding_aborted') || 
                              errorString.includes('binding_aborted');
      
      const shouldRetry = isNetworkErr && !isLastAttempt;
      
      if (shouldRetry) {
        // Longer delays for binding aborted errors and Firefox
        let multiplier = 2;
        if (isBindingAborted) multiplier = 3;
        if (isFirefox) multiplier *= 1.5;
        if (isPreviewEnv) multiplier *= 1.2;
        
        const delay = baseDelay * Math.pow(multiplier, attempt - 1);
        
        console.log(`🔄 Auth operation failed (attempt ${attempt}/${effectiveMaxRetries}), retrying in ${delay}ms:`, {
          error: error?.message || error,
          isBindingAborted,
          isFirefox,
          isPreviewEnv,
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