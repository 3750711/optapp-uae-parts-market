-- Create table for free order upload logs
CREATE TABLE IF NOT EXISTS public.free_order_upload_logs (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid,
  order_id uuid,
  file_url text,
  method text,
  duration_ms int,
  status text NOT NULL CHECK (status IN ('success','error')),
  error_details text,
  trace_id uuid
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS free_order_upload_logs_created_idx ON public.free_order_upload_logs(created_at DESC);

-- RLS policies
ALTER TABLE public.free_order_upload_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert logs
CREATE POLICY "Authenticated users can insert upload logs" ON public.free_order_upload_logs
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can view logs
CREATE POLICY "Only admins can view upload logs" ON public.free_order_upload_logs
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'admin'
));