-- Add missing public_id column to order_media table
ALTER TABLE public.order_media 
ADD COLUMN public_id TEXT;

-- Create index for better performance on public_id lookups
CREATE INDEX IF NOT EXISTS idx_order_media_public_id ON public.order_media(public_id);

-- Drop existing restrictive RLS policy that blocks service role insertions
DROP POLICY IF EXISTS "Only system can insert order media" ON public.order_media;

-- Create new RLS policy that allows service role insertions while maintaining security
CREATE POLICY "System and admins can insert order media" ON public.order_media
FOR INSERT WITH CHECK (
  -- Allow service role (for edge functions)
  current_setting('role') = 'service_role' OR
  -- Allow authenticated users with admin privileges
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ))
);