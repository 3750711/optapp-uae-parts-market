import { validateSupabaseAnonKey } from './supabaseValidation';

/**
 * Получение URL Supabase с валидацией
 */
export function getRuntimeSupabaseUrl(): string {
  const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
  const url = (rt.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL || 'https://api.partsbay.ae').replace(/\/+$/,'');
  
  // Валидация URL
  if (!url) {
    throw new Error('Supabase URL не настроен в runtime config');
  }
  
  try {
    new URL(url);
  } catch {
    throw new Error(`Неверный формат Supabase URL: ${url}`);
  }
  
  return url;
}

/**
 * Получение Anon Key с валидацией
 */
export function getRuntimeAnonKey(): string | undefined {
  const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
  const key = rt.SUPABASE_ANON_KEY ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  
  // В dev режиме выполняем валидацию и выводим предупреждения
  if (import.meta.env?.DEV && key) {
    const validation = validateSupabaseAnonKey(key);
    if (!validation.isValid) {
      console.warn('⚠️ Anon Key validation failed:', validation.errors);
    }
  }
  
  return key;
}

/**
 * Получение валидированного Anon Key (выбрасывает ошибку если невалиден)
 */
export function getValidatedAnonKey(): string {
  const key = getRuntimeAnonKey();
  
  if (!key) {
    throw new Error('Supabase Anon Key не настроен');
  }
  
  const validation = validateSupabaseAnonKey(key);
  if (!validation.isValid) {
    throw new Error(`Supabase Anon Key невалиден: ${validation.errors.join(', ')}`);
  }
  
  return key;
}

/**
 * Проверка окружения preview
 */
export function isPreviewEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return /(^preview--.+\.lovable\.app$)|(^localhost$)/i.test(h);
}

/**
 * Проверка что runtime config загружен
 */
export function isRuntimeConfigLoaded(): boolean {
  const rt = (globalThis as any).__PB_RUNTIME__;
  return !!(rt && Object.keys(rt).length > 0);
}

/**
 * Получение версии runtime config
 */
export function getRuntimeConfigVersion(): string | undefined {
  const rt = (globalThis as any).__PB_RUNTIME__ || {};
  return rt.__VERSION__;
}