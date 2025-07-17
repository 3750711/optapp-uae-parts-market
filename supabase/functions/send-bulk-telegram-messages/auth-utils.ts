import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyAdminAccess(supabase: any, authHeader: string | null) {
  if (!authHeader) {
    throw new Error('Admin access required: No authorization header')
  }

  // Extract JWT token
  const token = authHeader.replace('Bearer ', '')
  console.log('Token extracted, length:', token.length)

  // Get user from JWT
  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  
  if (userError || !user) {
    console.error('User authentication failed:', userError)
    throw new Error('Admin access required: Invalid token')
  }

  console.log('User authenticated:', user.id)

  // Check admin status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch failed:', profileError)
    throw new Error('Admin access required: Profile not found')
  }

  if (profile.user_type !== 'admin') {
    console.error('User is not admin:', profile.user_type)
    throw new Error('Admin access required: Insufficient permissions')
  }

  return user
}