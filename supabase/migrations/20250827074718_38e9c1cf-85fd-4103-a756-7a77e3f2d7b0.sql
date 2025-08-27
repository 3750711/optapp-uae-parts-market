-- Create order_media table for Telegram uploads
CREATE TABLE IF NOT EXISTS public.order_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('photo')) NOT NULL DEFAULT 'photo',
  source TEXT DEFAULT 'telegram',
  uploaded_by BIGINT, -- telegram user_id
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_order_media_order_id ON public.order_media(order_id);
CREATE INDEX IF NOT EXISTS idx_order_media_created_at ON public.order_media(created_at DESC);

-- Enable RLS
ALTER TABLE public.order_media ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view order media" 
ON public.order_media 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only system can insert order media"
ON public.order_media 
FOR INSERT 
WITH CHECK (false); -- Only Edge Function with service role can insert

CREATE POLICY "Admins can delete order media"
ON public.order_media 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'admin'
));