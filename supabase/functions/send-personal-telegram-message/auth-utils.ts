// Authentication utilities for personal messaging

export async function verifyAdminAccess(supabaseClient: any, authHeader: string) {
  console.log('=== ADMIN VERIFICATION START ===');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('Missing authorization header');
  }

  // Extract token properly
  const token = authHeader.replace('Bearer ', '').trim();
  console.log('Token extracted, length:', token.length);
  
  if (!token || token.length < 20) {
    console.error('Invalid token format or length');
    throw new Error('Invalid token format');
  }

  // Create supabase client with user token for proper auth
  const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
  const supabaseWithAuth = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    }
  );

  // Verify user session
  const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser(token);

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message || 'No user found');
    throw new Error(`Authentication failed: ${authError?.message || 'Invalid or expired token'}`);
  }

  console.log('User authenticated:', user.id);

  // Check admin permissions with service role client
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('Error fetching user profile:', profileError.message);
    throw new Error(`Failed to verify user permissions: ${profileError.message}`);
  }

  if (!profile || profile.user_type !== 'admin') {
    console.error('Admin access denied for user:', user.id, 'type:', profile?.user_type);
    throw new Error('Admin access required');
  }

  console.log('Admin permissions verified for user:', user.id);
  console.log('=== ADMIN VERIFICATION SUCCESS ===');
  
  return user;
}