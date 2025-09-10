import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorageSafe } from './clearAuthStorage';
import { getRuntimeAnonKey } from '@/config/runtimeSupabase';
import { clearAuthOnCORSError } from '@/utils/clearAuthOnError';

function getProjectRefFromAnon(anon?: string): string | null {
  if (!anon) return null;
  try {
    const [, payload] = anon.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.ref || null;
  } catch {
    return null;
  }
}

function hasStoredTokenForRef(anon?: string): boolean {
  try {
    const ref = getProjectRefFromAnon(anon);
    if (!ref) return false;
    
    const key = `sb-${ref}-auth-token`;
    return !!(localStorage.getItem(key) || sessionStorage.getItem(key));
  } catch {
    return false;
  }
}

/**
 * Auto-quarantine stale refresh tokens to prevent 400 "Invalid Refresh Token Not Found" errors
 * Should be called once on app startup
 */
export async function quarantineStaleRefreshTokens(): Promise<void> {
  try {
    // Small delay to allow SDK to initialize and attempt refresh
    await new Promise(resolve => setTimeout(resolve, 400));

    const { data: { session }, error } = await supabase.auth.getSession();
    const anonKey = getRuntimeAnonKey();
    const hadStored = hasStoredTokenForRef(anonKey);

    // При CORS/Network ошибках очищаем auth storage
    if (error && (error.message.includes('CORS') || error.message.includes('NetworkError'))) {
      console.warn('[AUTH] CORS/Network error detected, clearing auth storage');
      clearAuthOnCORSError();
      return;
    }

    // Case from logs: 400 Invalid Refresh Token -> session == null, but keys remain
    if (!session && hadStored) {
      console.warn('[AUTH] Quarantine stale refresh token (clearing project storage)');
      clearAuthStorageSafe();
    }
  } catch (error) {
    // Если ошибка связана с сетью/CORS - очищаем auth storage
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('CORS') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      console.warn('[AUTH] Network/CORS error in quarantine check, clearing auth storage');
      clearAuthOnCORSError();
    } else {
      console.warn('[AUTH] Quarantine check failed:', error);
    }
  }
}