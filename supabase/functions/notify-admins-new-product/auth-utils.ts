// Authentication utilities for admin notifications

export async function verifyAuthentication(supabaseClient: any, authHeader: string) {
  if (!authHeader) {
    throw new Error('Authorization header is required');
  }

  const jwt = authHeader.replace('Bearer ', '');
  
  // Get the user from the JWT token
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
  
  if (authError || !user) {
    console.error('Authentication failed:', authError);
    throw new Error('Invalid or expired token');
  }

  // Get user profile for additional information
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('user_type, full_name, opt_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    console.error('Failed to fetch user profile:', profileError);
    throw new Error('User profile not found');
  }

  return { user, profile };
}