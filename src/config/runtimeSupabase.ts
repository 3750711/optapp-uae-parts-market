export function getRuntimeSupabaseUrl(): string {
  const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
  return (rt.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://api.partsbay.ae').replace(/\/+$/,'');
}

export function getRuntimeAnonKey(): string | undefined {
  const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
  return rt.SUPABASE_ANON_KEY ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
}

export function isPreviewEnv(): boolean {
  const h = window.location.hostname;
  return /(^preview--.+\.lovable\.app$)|(^localhost$)/i.test(h);
}