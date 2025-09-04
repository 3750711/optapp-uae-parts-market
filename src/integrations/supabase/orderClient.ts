import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Dedicated Supabase client for order operations with hardcoded correct URL
const supabaseUrl = 'https://api.partsbay.ae';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';

// Create dedicated Supabase client for orders
export const orderClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});

console.log('🚀 Order Client initialized with URL:', supabaseUrl);