
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AdaptiveSupabaseClient } from './adaptiveClient';

// Direct Supabase URL and proxy URL
const directSupabaseUrl = 'https://api.partsbay.ae';
const proxyUrl = 'https://api.partsbay.ae';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Create primary client with direct Supabase connection
const primaryClient = createClient<Database>(directSupabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});

// Initialize adaptive client with dual-domain support
const adaptiveClient = new AdaptiveSupabaseClient({
  primaryUrl: directSupabaseUrl,  // Direct Supabase connection
  primaryKey: supabaseAnonKey,
  proxyUrl: proxyUrl,            // Proxy for UAE/slow networks
  client: primaryClient
});

console.log('🌍 Supabase Client initialized with dual-domain support:');
console.log('  • Primary (direct):', directSupabaseUrl);
console.log('  • Proxy (UAE/slow):', proxyUrl);

// Initialize connection with smart fallback
adaptiveClient.initializeConnection().catch(err => {
  console.error('🚨 Failed to initialize Supabase connection:', err);
});

export const supabase = adaptiveClient;
