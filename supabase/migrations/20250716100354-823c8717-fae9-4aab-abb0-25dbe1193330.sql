-- Create telegram_auth_logs table for nonce protection
CREATE TABLE public.telegram_auth_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_id BIGINT NOT NULL,
  auth_date INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Create index for fast lookups
CREATE INDEX idx_telegram_auth_logs_telegram_id_auth_date 
ON public.telegram_auth_logs(telegram_id, auth_date);

-- Enable RLS
ALTER TABLE public.telegram_auth_logs ENABLE ROW LEVEL SECURITY;

-- Only system can manage this table
CREATE POLICY "System manages telegram auth logs" 
ON public.telegram_auth_logs 
FOR ALL 
USING (false) 
WITH CHECK (false);