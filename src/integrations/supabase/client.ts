
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});

console.log('🌍 Supabase Client initialized:', supabaseUrl);
