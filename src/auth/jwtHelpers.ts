export function decodeJwt<T = any>(token?: string | null): T | null {
  if (!token) return null;
  try {
    const [, payload] = (token as string).split('.');
    const json = atob(payload.replace(/-/g,'+').replace(/_/g,'/'));
    return JSON.parse(json) as T;
  } catch { return null; }
}