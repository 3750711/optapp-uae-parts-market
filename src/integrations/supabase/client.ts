
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Read runtime configuration
const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
const SUPABASE_URL = rt.SUPABASE_URL ?? (import.meta as any).env?.VITE_SUPABASE_URL ?? 'https://api.partsbay.ae';
const SUPABASE_ANON_KEY = rt.SUPABASE_ANON_KEY ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL/ANON not configured');
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

console.log('🌍 Supabase Client unified with runtime config');
console.log('   URL:', SUPABASE_URL);

// Only log keys in development mode
if (import.meta.env.DEV) {
  console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

// Export backward compatible function
export async function getSupabaseClient() {
  return supabase;
}
