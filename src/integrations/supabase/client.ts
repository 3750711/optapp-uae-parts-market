
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Create Supabase client using environment variables
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: { 
      persistSession: true, 
      autoRefreshToken: true, 
      detectSessionInUrl: true, 
      flowType: 'pkce' 
    }
  }
);
