
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { validateSupabaseAnonKey, createErrorReport, getConfigSource } from '@/config/supabaseValidation';
import { logConfigDiagnostics } from '@/config/configDebugger';

// Read runtime configuration with validation
const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
const SUPABASE_URL = rt.SUPABASE_URL ?? (import.meta as any).env?.VITE_SUPABASE_URL ?? 'https://api.partsbay.ae';
const SUPABASE_ANON_KEY = rt.SUPABASE_ANON_KEY ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Enhanced validation
if (!SUPABASE_URL) {
  const error = '❌ Supabase URL не настроен. Проверьте public/runtime-config.js или .env файл';
  console.error(error);
  throw new Error(error);
}

if (!SUPABASE_ANON_KEY) {
  const error = '❌ Supabase Anon Key не настроен. Проверьте public/runtime-config.js или .env файл';
  console.error(error);
  throw new Error(error);
}

// Validate Anon Key format and content
const validation = validateSupabaseAnonKey(SUPABASE_ANON_KEY);
if (!validation.isValid) {
  const errorReport = createErrorReport(validation);
  console.error(errorReport);
  throw new Error('Supabase Anon Key validation failed. Check console for details.');
}

// Create Supabase client with runtime configuration
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  },
  global: { 
    headers: { 'x-client-info': 'partsbay-web' } 
  }
});

// Enhanced logging with validation details
const keySource = getConfigSource(SUPABASE_ANON_KEY);
console.log('🌍 Supabase Client инициализирован успешно');
console.log(`   URL: ${SUPABASE_URL}`);
console.log(`   Key source: ${keySource}`);

if (validation.details) {
  console.log(`   Key preview: ${validation.details.keyPreview}`);
  console.log(`   Project ref: ${validation.details.ref}`);
  if (validation.details.expiry) {
    console.log(`   Expires: ${validation.details.expiry.toISOString()}`);
  }
}

// Show warnings if any
if (validation.warnings.length > 0) {
  console.group('⚠️ Предупреждения конфигурации:');
  validation.warnings.forEach(warning => console.warn(warning));
  console.groupEnd();
}

// In development, show full diagnostics
if (import.meta.env.DEV) {
  console.log('🔧 Для полной диагностики выполните: __debugSupabaseConfig()');
  // Auto-run diagnostics in dev mode
  setTimeout(() => logConfigDiagnostics(), 1000);
}

// Export backward compatible function
export async function getSupabaseClient() {
  return supabase;
}
