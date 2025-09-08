import { decodeJwt } from '@/auth/jwtHelpers';
import { getRuntimeSupabaseUrl, getRuntimeAnonKey } from '@/config/runtimeSupabase';

export function getProjectRef(): string | null {
  // 1) из anon key (payload.ref)
  const jwt = decodeJwt<any>(getRuntimeAnonKey());
  if (jwt?.ref) return jwt.ref;

  // 2) из URL вида https://<ref>.supabase.co или кастомного домена
  const url = getRuntimeSupabaseUrl();
  const m = url.match(/^https:\/\/([a-z0-9]{20})\.supabase\.co/i);
  if (m) return m[1];
  
  // кастомный домен: хеш-неймспейс
  try { return btoa(url).replace(/=+$/,'').slice(0,20); } catch { return null; }
}

export function getProjectRefFromAnon(anon?: string): string | null {
  if (!anon) return null;
  try {
    const [, payload] = anon.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded?.ref || null;
  } catch {
    return null;
  }
}