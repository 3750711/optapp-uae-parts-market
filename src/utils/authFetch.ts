import { supabase } from '@/integrations/supabase/client';

let refreshing: Promise<any> | null = null;

export async function authFetch<T>(doRequest: () => Promise<T>): Promise<T> {
  try {
    return await doRequest();
  } catch (e: any) {
    if (!is401(e)) throw e;

    // Single-flight refresh to prevent concurrent token refreshes
    if (!refreshing) {
      refreshing = supabase.auth.refreshSession().finally(() => (refreshing = null));
    }
    await refreshing;

    // Retry request once after refresh
    return await doRequest();
  }
}

function is401(error: any): boolean {
  const code = error?.status || error?.response?.status || error?.code;
  return code === 401 || error?.message?.includes('JWT expired') || error?.message?.includes('Invalid JWT');
}

// Enhanced auth fetch with retry logic
export async function safeAuthFetch<T>(
  doRequest: () => Promise<T>, 
  maxRetries = 1
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
      return await authFetch(doRequest);
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries || !is401(error)) {
        throw error;
      }
    }
  }
  
  throw lastError;
}