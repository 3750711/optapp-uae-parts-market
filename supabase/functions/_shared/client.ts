import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

/**
 * Creates a standardized Supabase client for Edge Functions
 * Ensures all Edge Functions use the same configuration and proxy domain
 */
export function createEdgeFunctionClient(serviceRoleKey?: string) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://api.partsbay.ae';
  const supabaseKey = serviceRoleKey || Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseKey) {
    throw new Error('Supabase key not found');
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-client-info': 'edge-function',
      },
    },
  });
}

/**
 * Creates an authenticated Supabase client using service role key
 */
export function createServiceClient() {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY not found');
  }
  return createEdgeFunctionClient(serviceRoleKey);
}