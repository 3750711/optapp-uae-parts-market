import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { loadRuntimeConfig } from '@/config/runtime';

type SupabaseClientType = ReturnType<typeof createClient<Database>>;

let clientPromise: Promise<SupabaseClientType> | null = null;

export async function getSupabaseClient(): Promise<SupabaseClientType> {
  if (clientPromise) {
    return clientPromise;
  }

  clientPromise = initializeSupabaseClient();
  return clientPromise;
}

async function initializeSupabaseClient(): Promise<SupabaseClientType> {
  try {
    // Load runtime configuration
    const config = await loadRuntimeConfig();
    
    // Get anon key from environment variables
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseAnonKey) {
      throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
    }

    // Create Supabase client with runtime URL and env anon key
    const client = createClient<Database>(config.SUPABASE_URL, supabaseAnonKey, {
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true, 
        flowType: 'pkce' 
      }
    });

    console.log('🌍 Supabase Client initialized with runtime config:', config.SUPABASE_URL);
    
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    throw error;
  }
}

// Export a function to get the client synchronously (for backward compatibility)
// This will throw if called before the client is initialized
export function getSupabaseClientSync(): SupabaseClientType {
  if (!clientPromise) {
    throw new Error('Supabase client not initialized. Call getSupabaseClient() first.');
  }
  
  // This is a hack to get the client synchronously if it's already resolved
  let client: SupabaseClientType | null = null;
  let error: Error | null = null;
  
  clientPromise.then(c => client = c).catch(e => error = e);
  
  if (error) {
    throw error;
  }
  
  if (!client) {
    throw new Error('Supabase client is still initializing. Use getSupabaseClient() instead.');
  }
  
  return client;
}