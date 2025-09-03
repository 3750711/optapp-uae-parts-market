
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration using custom domain
const supabaseUrl = 'https://api.partsbay.ae';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create Supabase client with custom domain
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});

console.log('🌍 Supabase Client initialized with custom domain:', supabaseUrl);
