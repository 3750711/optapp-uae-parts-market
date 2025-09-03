
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AdaptiveSupabaseClient } from './adaptiveClient';
import { getNetworkInfo, isSlowConnection } from '@/utils/networkUtils';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://api.partsbay.ae';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';

// Create primary client with direct Supabase connection
const primaryClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true, 
    flowType: 'pkce' 
  }
});

// Initialize adaptive client with proxy fallback
const adaptiveClient = new AdaptiveSupabaseClient({
  primaryUrl: supabaseUrl, // Always use proxy URL (https://api.partsbay.ae)
  primaryKey: supabaseAnonKey,
  proxyUrl: supabaseUrl, // Use same URL as it's already our proxy
  client: primaryClient
});

// Network diagnostics
const networkInfo = getNetworkInfo();
const isSlow = isSlowConnection();

console.log('🔧 Network Info:', {
  effectiveType: networkInfo.effectiveType,
  downlink: networkInfo.downlink,
  rtt: networkInfo.rtt,
  isSlowConnection: isSlow
});

console.log('🔧 Supabase Client initialized with adaptive connection');

// Initialize connection with smart fallback
adaptiveClient.initializeConnection().catch(err => {
  console.error('🚨 Failed to initialize Supabase connection:', err);
});

export const supabase = adaptiveClient;
