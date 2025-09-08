import { supabase } from '@/integrations/supabase/client';
import { clearAuthStorageSafe } from './clearAuthStorage';
import { getRuntimeAnonKey } from '@/config/runtimeSupabase';

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

    const { data: { session } } = await supabase.auth.getSession();
    const anonKey = getRuntimeAnonKey();
    const hadStored = hasStoredTokenForRef(anonKey);

    // Case from logs: 400 Invalid Refresh Token -> session == null, but keys remain
    if (!session && hadStored) {
      console.warn('[AUTH] Quarantine stale refresh token (clearing project storage)');
      clearAuthStorageSafe();
    }
  } catch (error) {
    console.warn('[AUTH] Quarantine check failed:', error);
  }
}