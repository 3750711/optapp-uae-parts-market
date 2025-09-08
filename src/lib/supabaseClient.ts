import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

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
    const rt: any = (globalThis as any).__PB_RUNTIME__ || {};
    const SUPABASE_URL = rt.SUPABASE_URL ?? (import.meta as any).env?.VITE_SUPABASE_URL ?? 'https://api.partsbay.ae';
    const SUPABASE_ANON_KEY = rt.SUPABASE_ANON_KEY ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Supabase URL/ANON not configured');
    }

    // Create Supabase client with runtime URL and anon key
    const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    console.log('🌍 Supabase Client initialized successfully');
    console.log('   URL:', SUPABASE_URL);
    
    // Only log keys in development mode
    if (import.meta.env.DEV) {
      console.log('   Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    }
    
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