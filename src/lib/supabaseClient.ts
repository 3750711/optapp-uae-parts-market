// This file is deprecated - use @/integrations/supabase/client instead
// Kept for backward compatibility

export { supabase as default, getSupabaseClient } from '@/integrations/supabase/client';

// Deprecated: Use the unified client instead
export async function getSupabaseClientSync() {
  const { supabase } = await import('@/integrations/supabase/client');
  return supabase;
}