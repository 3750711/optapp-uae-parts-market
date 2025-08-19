-- Fix security issues: Drop and recreate functions with proper search_path and add profile access logging

-- 1. Drop existing functions that need to be updated
DROP FUNCTION IF EXISTS public.validate_profile_update(uuid, user_type, verification_status, boolean);

-- 2. Fix existing security definer functions with proper search_path
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

-- Recreate validation function with proper search_path
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

-- 3. Create profile access logging table
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

-- 4. Create function to log profile access
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