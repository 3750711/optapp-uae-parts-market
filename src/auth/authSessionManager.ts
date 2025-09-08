import type { Session } from '@supabase/supabase-js';
import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, isPreviewEnv } from '@/config/runtimeSupabase';
import { getProjectRef } from '@/auth/projectRef';

function getAllowedIssuers(): string[] {
  const base = getRuntimeSupabaseUrl().replace(/\/+$/,'');
  const allow = new Set<string>([`${base}/auth/v1`]);
  const ref = getProjectRef();
  if (ref) allow.add(`https://${ref}.supabase.co/auth/v1`);
  return Array.from(allow);
}

export function validateSessionIssuer(access_token?: string): { ok: boolean; reason?: string; iss?: string; allow?: string[] } {
  const jwt = decodeJwt<any>(access_token);
  const iss = String(jwt?.iss || '');
  if (!iss) return { ok: false, reason: 'no_iss' };
  const allow = getAllowedIssuers();
  const ok = allow.some(a => iss.startsWith(a));
  return ok ? { ok: true, iss, allow } : { ok: false, reason: `iss_mismatch:${iss}`, iss, allow };
}

export function checkSessionSoft(session: Session | null) {
  if (!session?.access_token) return { ok: false, forceLogout: false, reason: 'no_token' };

  const now = Math.floor(Date.now()/1000);
  const jwt: any = decodeJwt(session.access_token);
  const skew = 60;
  if (jwt?.exp && jwt.exp + skew < now) return { ok: false, forceLogout: true, reason: 'expired' };

  const v = validateSessionIssuer(session.access_token);
  if (!v.ok) {
    console.debug('[AUTH][ISS]', v); // диагностика для отладки
    return { ok: true, forceLogout: false, reason: `soft_${v.reason}` }; // мягко: не логаутим
  }
  return { ok: true, forceLogout: false };
}