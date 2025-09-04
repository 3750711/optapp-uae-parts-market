
import type { Database } from './types';
import { getSupabaseClient } from '@/lib/supabaseClient';

// Legacy synchronous export for backward compatibility
// This will be a Promise-based client under the hood
let _supabaseClient: ReturnType<typeof import('@supabase/supabase-js').createClient<Database>> | null = null;

// Initialize client asynchronously and cache it
getSupabaseClient().then(client => {
  _supabaseClient = client;
}).catch(error => {
  console.error('Failed to initialize Supabase client:', error);
});

// Proxy object that forwards all calls to the actual client
export const supabase = new Proxy({} as ReturnType<typeof import('@supabase/supabase-js').createClient<Database>>, {
  get(target, prop) {
    if (!_supabaseClient) {
      throw new Error('Supabase client not yet initialized. Make sure to wait for initialization or use getSupabaseClient() directly.');
    }
    
    const value = _supabaseClient[prop as keyof typeof _supabaseClient];
    
    // Bind methods to maintain proper context
    if (typeof value === 'function') {
      return value.bind(_supabaseClient);
    }
    
    return value;
  }
});

// Also export the Promise-based client for new code
export { getSupabaseClient };
