
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { AdaptiveSupabaseClient } from './adaptiveClient';
import { getNetworkInfo, isSlowConnection } from '@/utils/networkUtils';

const supabaseUrl = 'https://vfiylfljiixqkjfqubyq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0';

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
  primaryUrl: supabaseUrl,
  primaryKey: supabaseAnonKey,
  proxyUrl: 'https://api.partsbay.ae',
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

// Test connection and switch to proxy if needed
adaptiveClient.testConnection(primaryClient).then(isWorking => {
  if (!isWorking) {
    console.warn('⚠️ Direct Supabase connection failed, attempting proxy...');
    adaptiveClient.switchToProxy().then(switched => {
      if (switched) {
        console.log('✅ Successfully switched to proxy connection');
      } else {
        console.error('❌ Both direct and proxy connections failed');
      }
    });
  } else {
    console.log('✅ Direct Supabase connection working');
  }
});

export const supabase = adaptiveClient;
