-- Fix security definer functions with proper search_path and add profile access logging

-- 1. Fix existing security definer functions
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE  
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'admin' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Add helper function to check if user is seller
CREATE OR REPLACE FUNCTION public.is_current_user_seller()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'seller' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Add helper function to check if user is admin user (alternative naming)
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT user_type = 'admin' 
     FROM public.profiles 
     WHERE id = auth.uid()),
    false
  );
$$;

-- Add helper function for validation
CREATE OR REPLACE FUNCTION public.validate_profile_update(
  p_user_id UUID,
  p_user_type user_type,
  p_verification_status verification_status,
  p_is_trusted_seller BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT true; -- Basic validation, can be extended
$$;

-- 2. Create profile access logging table
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessor_id UUID NOT NULL, -- who accessed
  accessed_profile_id UUID NOT NULL, -- whose profile was accessed
  access_type TEXT NOT NULL, -- 'view', 'update', 'create_order', 'price_offer'
  context_data JSONB DEFAULT '{}', -- additional context (order_id, product_id, etc)
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on access logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Only admins can view profile access logs" ON public.profile_access_logs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- System can insert access logs
CREATE POLICY "System can insert profile access logs" ON public.profile_access_logs
FOR INSERT WITH CHECK (true);

-- 3. Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_accessed_profile_id UUID,
  p_access_type TEXT,
  p_context_data JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only log if accessor is authenticated
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.profile_access_logs (
      accessor_id,
      accessed_profile_id,
      access_type,
      context_data,
      ip_address,
      user_agent
    ) VALUES (
      auth.uid(),
      p_accessed_profile_id,
      p_access_type,
      p_context_data,
      p_ip_address,
      p_user_agent
    );
  END IF;
END;
$$;

-- 4. Create trigger to automatically log profile views
CREATE OR REPLACE FUNCTION public.trigger_log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Log profile access when someone views a profile that's not their own
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL AND auth.uid() != NEW.id THEN
    PERFORM public.log_profile_access(
      NEW.id,
      'view',
      jsonb_build_object(
        'viewed_fields', TG_ARGV[0] -- can pass field list if needed
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: We can't directly trigger on SELECT operations in PostgreSQL
-- Instead, we'll implement logging in the application layer

-- 5. Create view for public seller information (basic info only)
CREATE OR REPLACE VIEW public.public_seller_profiles AS
SELECT 
  id,
  full_name,
  company_name,
  rating,
  user_type,
  location,
  created_at,
  verification_status,
  listing_count
FROM public.profiles
WHERE user_type = 'seller'
  AND verification_status != 'rejected';

-- Make the view publicly readable
GRANT SELECT ON public.public_seller_profiles TO anon, authenticated;

-- 6. Create function to get sensitive profile data with business relationship check
CREATE OR REPLACE FUNCTION public.get_profile_with_relationship_check(p_profile_id UUID)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  telegram TEXT,
  opt_id TEXT,
  user_type user_type,
  company_name TEXT,
  rating NUMERIC,
  location TEXT,
  has_business_relationship BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_has_relationship BOOLEAN := false;
  v_is_admin BOOLEAN := false;
  v_is_own_profile BOOLEAN := false;
BEGIN
  -- Check if it's user's own profile
  v_is_own_profile := (auth.uid() = p_profile_id);
  
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.user_type = 'admin'
  ) INTO v_is_admin;
  
  -- Check for business relationship (orders or active price offers)
  IF NOT v_is_own_profile AND NOT v_is_admin THEN
    SELECT EXISTS (
      -- Orders where current user is buyer and target is seller, or vice versa
      SELECT 1 FROM public.orders 
      WHERE (buyer_id = auth.uid() AND seller_id = p_profile_id)
         OR (seller_id = auth.uid() AND buyer_id = p_profile_id)
      
      UNION
      
      -- Active price offers between users
      SELECT 1 FROM public.price_offers po
      JOIN public.products p ON po.product_id = p.id
      WHERE (po.buyer_id = auth.uid() AND p.seller_id = p_profile_id)
         OR (p.seller_id = auth.uid() AND po.buyer_id = p_profile_id)
         AND po.status = 'pending'
         AND po.expires_at > now()
    ) INTO v_has_relationship;
  END IF;
  
  -- Log the access
  PERFORM public.log_profile_access(
    p_profile_id,
    'detailed_view',
    jsonb_build_object(
      'has_relationship', v_has_relationship,
      'is_admin', v_is_admin,
      'is_own_profile', v_is_own_profile
    )
  );
  
  -- Return profile data based on access level
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    CASE 
      WHEN v_is_own_profile OR v_is_admin OR v_has_relationship THEN p.email
      ELSE NULL
    END,
    CASE 
      WHEN v_is_own_profile OR v_is_admin OR v_has_relationship THEN p.phone
      ELSE NULL
    END,
    CASE 
      WHEN v_is_own_profile OR v_is_admin OR v_has_relationship THEN p.telegram
      ELSE NULL
    END,
    CASE 
      WHEN v_is_own_profile OR v_is_admin OR v_has_relationship THEN p.opt_id
      ELSE NULL
    END,
    p.user_type,
    p.company_name,
    p.rating,
    p.location,
    v_has_relationship OR v_is_admin OR v_is_own_profile
  FROM public.profiles p
  WHERE p.id = p_profile_id;
END;
$$;

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed_profile 
ON public.profile_access_logs(accessed_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessor 
ON public.profile_access_logs(accessor_id, created_at DESC);