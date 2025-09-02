
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createTimeoutFetch } from '@/utils/timeoutFetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vfiylfljiixqkjfqubyq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"

console.log('🔧 Supabase URL:', supabaseUrl);

// Create timeout-aware fetch for mobile networks
const timeoutFetch = createTimeoutFetch();

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  },
  global: {
    fetch: timeoutFetch
  }
});
