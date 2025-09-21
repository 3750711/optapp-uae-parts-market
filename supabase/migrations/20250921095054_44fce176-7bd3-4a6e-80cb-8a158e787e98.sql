-- Create a new RLS policy for Edge Functions to access profiles directly by token
-- This allows the validate-profile-token Edge Function to work without session variables

CREATE POLICY "Edge Functions can access profiles by token" ON public.profiles
FOR SELECT USING (
  -- Allow Edge Functions to access seller profiles by token directly
  user_type = 'seller' 
  AND public_share_enabled = true 
  AND public_share_expires_at > now() 
  AND public_share_token IS NOT NULL
  -- This policy will be used by Edge Functions that pass the token in their query
);