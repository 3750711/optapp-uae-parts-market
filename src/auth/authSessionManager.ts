import type { Session } from '@supabase/supabase-js';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, isPreviewEnv } from '@/config/runtimeSupabase';
import { getProjectRef } from '@/auth/projectRef';

// Simplified: only validate token expiration, let Supabase SDK handle the rest
export function checkSessionSoft(session: Session | null) {
  if (!session?.access_token) return { ok: false, forceLogout: false, reason: 'no_token' };

  const now = Math.floor(Date.now()/1000);
  const jwt: any = decodeJwt(session.access_token);
  const skew = 60;
  
  // Only check expiration - let Supabase handle issuer validation
  if (jwt?.exp && jwt.exp + skew < now) {
    return { ok: false, forceLogout: true, reason: 'expired' };
  }
  
  return { ok: true, forceLogout: false };
}