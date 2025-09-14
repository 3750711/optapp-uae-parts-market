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
    // Увеличиваем задержку до 2 секунд
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: { session }, error } = await supabase.auth.getSession();
    
    // Только очищаем если явная ошибка refresh token
    if (error?.message?.includes('Invalid Refresh Token')) {
      console.warn('[AUTH] Invalid refresh token detected, clearing storage');
      clearAuthStorageSafe();
      return;
    }
    
    // НЕ очищаем storage просто потому что нет сессии
    // Пусть Supabase сам управляет жизненным циклом токенов
    
  } catch (error) {
    console.warn('[AUTH] Quarantine check failed:', error);
    // Не очищаем при ошибках сети
  }
}