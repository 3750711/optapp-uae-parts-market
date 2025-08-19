-- Add profile access logging system (simplified)

-- 1. Create profile access logging table
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

-- 2. Create function to log profile access
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
  -- Only log if accessor is authenticated and not accessing own profile
  IF auth.uid() IS NOT NULL AND auth.uid() != p_accessed_profile_id THEN
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
EXCEPTION 
  WHEN OTHERS THEN
    -- Don't fail if logging fails
    NULL;
END;
$$;

-- 3. Create view for public seller information (basic info only)
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
WHERE user_type = 'seller';

-- Make the view publicly readable
GRANT SELECT ON public.public_seller_profiles TO anon, authenticated;

-- 4. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed_profile 
ON public.profile_access_logs(accessed_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessor 
ON public.profile_access_logs(accessor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_access_logs_access_type 
ON public.profile_access_logs(access_type, created_at DESC);

-- 5. Create helper function for admin dashboard to view access statistics
CREATE OR REPLACE FUNCTION public.get_profile_access_stats(
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (now() - interval '30 days'),
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT now()
)
RETURNS TABLE (
  accessed_profile_id UUID,
  accessed_profile_name TEXT,
  accessor_count BIGINT,
  access_count BIGINT,
  last_access TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only admins can view access statistics
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Only admins can view access statistics.';
  END IF;
  
  RETURN QUERY
  SELECT 
    pal.accessed_profile_id,
    p.full_name,
    COUNT(DISTINCT pal.accessor_id)::BIGINT as accessor_count,
    COUNT(*)::BIGINT as access_count,
    MAX(pal.created_at) as last_access
  FROM public.profile_access_logs pal
  JOIN public.profiles p ON p.id = pal.accessed_profile_id
  WHERE pal.created_at >= p_start_date 
    AND pal.created_at <= p_end_date
  GROUP BY pal.accessed_profile_id, p.full_name
  ORDER BY access_count DESC;
END;
$$;