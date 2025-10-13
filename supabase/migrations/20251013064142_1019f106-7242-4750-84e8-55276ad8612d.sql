-- Remove redundant RLS policy with validate_profile_update
-- This policy was blocking preferred_locale updates because validate_profile_update
-- expects all parameters to be NOT NULL, but we only send changed fields
DROP POLICY IF EXISTS "Users can update own profile with validation" ON public.profiles;

-- The simple policy "Users update own profile" is sufficient:
-- - Users can update their own profile: (id = auth.uid())
-- - Admins can update any profile: is_admin()
-- - Critical fields (user_type, verification_status, is_trusted_seller) are already
--   protected by database triggers (e.g., audit_sensitive_profile_changes)