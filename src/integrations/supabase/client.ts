
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = import.meta.env.DEV ? "/supabase" : "https://vfiylfljiixqkjfqubyq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
      timeout: 30000, // 30 seconds for WebSocket connection
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries: number) => Math.min(tries * 1000, 10000), // Exponential backoff up to 10s
    logger: (level: string, message: string, meta?: any) => {
      if (level === 'error') {
        console.error('🔴 Realtime Error:', message, meta);
      } else if (level === 'warn') {
        console.warn('🟡 Realtime Warning:', message, meta);
      } else {
        console.log('🔵 Realtime:', message, meta);
      }
    },
    encode: (payload: any, callback: (encoded: string) => void) => {
      try {
        callback(JSON.stringify(payload));
      } catch (error) {
        console.error('🔴 Realtime encoding error:', error);
      }
    },
    decode: (payload: string, callback: (decoded: any) => void) => {
      try {
        callback(JSON.parse(payload));
      } catch (error) {
        console.error('🔴 Realtime decoding error:', error);
      }
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    },
    fetch: (url: RequestInfo | URL, options: RequestInit = {}) => {
      // Add timeout and retry logic for all requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const enhancedOptions = {
        ...options,
        signal: controller.signal,
      };
      
      return fetch(url, enhancedOptions)
        .finally(() => clearTimeout(timeoutId))
        .catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection');
          }
          throw error;
        });
    }
  }
})
