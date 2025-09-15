import type { Session } from '@supabase/supabase-js';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, isPreviewEnv } from '@/config/runtimeSupabase';
import { getProjectRef } from '@/auth/projectRef';

export function checkSessionSoft(session: Session | null) {
  if (!session?.access_token) return { ok: false, forceLogout: false, reason: 'no_token' };

  const now = Math.floor(Date.now()/1000);
  const jwt: any = decodeJwt(session.access_token);
  const skew = 60;
  
  // КРИТИЧНО: Добавить проверку что JWT декодирован
  if (!jwt) {
    return { ok: false, forceLogout: true, reason: 'invalid_jwt' };
  }
  
  // КРИТИЧНО: Проверить issuer (должен быть от Supabase)
  if (jwt.iss && !jwt.iss.includes('supabase')) {
    return { ok: false, forceLogout: true, reason: 'invalid_issuer' };
  }
  
  // Проверка expiry
  if (jwt?.exp && jwt.exp + skew < now) {
    return { ok: false, forceLogout: true, reason: 'expired' };
  }
  
  // КРИТИЧНО: Проверить что токен не из будущего (защита от clock skew атак)
  if (jwt?.iat && jwt.iat - skew > now) {
    return { ok: false, forceLogout: true, reason: 'future_token' };
  }
  
  return { ok: true, forceLogout: false };
}