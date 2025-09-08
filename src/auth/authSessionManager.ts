import type { Session } from '@supabase/supabase-js';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, isPreviewEnv } from '@/config/runtimeSupabase';

export function validateSessionIssuer(access_token?: string): { ok: boolean; reason?: string } {
  const jwt = decodeJwt<any>(access_token);
  if (!jwt?.iss) return { ok: false, reason: 'no_iss' };
  const expected = `${getRuntimeSupabaseUrl()}/auth/v1`;
  return String(jwt.iss).startsWith(expected)
    ? { ok: true }
    : { ok: false, reason: `iss_mismatch:${jwt.iss}!=${expected}` };
}

export function checkSessionSoft(session: Session | null) {
  if (!session?.access_token) return { ok:false, forceLogout:false, reason:'no_token' };

  const now = Math.floor(Date.now()/1000);
  const jwt: any = decodeJwt(session.access_token);
  const skew = 60;
  if (jwt?.exp && jwt.exp + skew < now) return { ok:false, forceLogout:true, reason:'expired' };

  const iss = validateSessionIssuer(session.access_token);
  if (!iss.ok) {
    if (isPreviewEnv()) return { ok:true, forceLogout:false, reason:`soft_${iss.reason}` };
    return { ok:false, forceLogout:true, reason:iss.reason };
  }
  return { ok:true, forceLogout:false };
}