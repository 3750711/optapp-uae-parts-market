-- Create RLS policy for sellers to view verified buyers
CREATE POLICY "Sellers can view verified buyers" ON public.profiles
FOR SELECT USING (
  user_type = 'buyer' 
  AND verification_status = 'verified' 
  AND opt_id IS NOT NULL
  AND is_current_user_seller()
);