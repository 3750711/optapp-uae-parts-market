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
      throw new Error('VITE_SUPABASE_ANON_KEY environment variable is not defined');
    }

    // Validate anon key format (basic JWT structure check)
    if (!supabaseAnonKey.includes('.')) {
      throw new Error('VITE_SUPABASE_ANON_KEY does not appear to be a valid JWT token');
    }

    // Create Supabase client with runtime URL and env anon key
    const client = createClient<Database>(config.SUPABASE_URL, supabaseAnonKey, {
      auth: { 
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true, 
        flowType: 'pkce' 
      },
      realtime: {
        params: {
          eventsPerSecond: config.REALTIME_PARAMS?.eventsPerSecond || 10,
          timeout: config.REALTIME_PARAMS?.timeout || 30000,
          vsn: config.REALTIME_PARAMS?.vsn || '1.0.0'
        }
      }
    });

    console.log('🌍 Supabase Client initialized successfully');
    console.log('   URL:', config.SUPABASE_URL);
    console.log('   Key:', supabaseAnonKey.substring(0, 20) + '...');
    
    return client;
  } catch (error) {
    console.error('❌ Failed to initialize Supabase client:', error);
    throw new Error(`Supabase initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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