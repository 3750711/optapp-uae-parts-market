
-- Add RLS policy to allow sellers to view buyer profiles
CREATE POLICY "Sellers can view buyer profiles" ON public.profiles
FOR SELECT USING (
  -- Allow sellers to view buyer profiles that have opt_id
  (user_type = 'buyer' AND opt_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles seller_profile 
    WHERE seller_profile.id = auth.uid() 
    AND seller_profile.user_type = 'seller'
  )) OR
  -- Keep existing access (users see own profile, admins see all)
  id = auth.uid() OR
  is_admin_user()
);
