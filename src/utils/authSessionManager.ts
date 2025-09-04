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

// Check if token was issued by current Supabase domain
export function isTokenFromCurrentDomain(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded?.iss) return false;
  
  const currentDomain = 'https://api.partsbay.ae';
  const expectedIssuer = `${currentDomain}/auth/v1`;
  
  console.log('🔍 Token domain check:', { 
    tokenIssuer: decoded.iss, 
    expectedIssuer,
    isValid: decoded.iss === expectedIssuer 
  });
  
  return decoded.iss === expectedIssuer;
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

// Check if error is a network error
export function isNetworkError(error: any): boolean {
  return error?.message?.includes('NetworkError') ||
         error?.message?.includes('Failed to fetch') ||
         error?.message?.includes('Network request failed') ||
         error?.message?.includes('fetch') ||
         error?.name === 'TypeError' ||
         !navigator.onLine;
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
      console.warn('🌐 Network error during session validation:', error);
      await forceCleanLogout();
      return false;
    }
    
    console.error('❌ Error validating session:', error);
    return false;
  }
}