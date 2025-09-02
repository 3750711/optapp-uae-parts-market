
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Force proxy for lovable.dev domains to avoid CORS issues
const isLovableDomain = window.location.hostname.includes('lovable.dev') || window.location.hostname.includes('lovableproject.com');
const useProxy = import.meta.env.VITE_USE_SUPABASE_PROXY === 'true' || isLovableDomain;

const supabaseUrl = useProxy
  ? window.location.origin + '/supabase'
  : "https://vfiylfljiixqkjfqubyq.supabase.co";

console.log('🔧 Supabase URL:', supabaseUrl, 'useProxy:', useProxy, 'isLovable:', isLovableDomain);
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});
