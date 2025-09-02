
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Always use same-origin proxy to avoid CORS/operator issues on cellular networks
const supabaseUrl = typeof window !== 'undefined' 
  ? window.location.origin + '/supabase' 
  : "https://vfiylfljiixqkjfqubyq.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4OTEwMjUsImV4cCI6MjA2MDQ2NzAyNX0.KZbRSipkwoZDY8pL7GZhzpAQXXjZ0Vise1rXHN8P4W0"

let _client: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (_client) return _client

  _client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      // Environment-specific storage key to prevent preview/prod conflicts
      storageKey: typeof window !== 'undefined' 
        ? `sb-vfiylfljiixqkjfqubyq-${window.location.hostname.includes('lovable') ? 'preview' : 'prod'}`
        : 'sb-vfiylfljiixqkjfqubyq-default'
    },
    db: {
      schema: 'public'
    }
    // ❌ Removed global.fetch - let Supabase handle auth requests natively
  })

  return _client
}

// Legacy export for backward compatibility - will be replaced gradually
export const supabase = getSupabase()
