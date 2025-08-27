-- Create table for Telegram user sessions
CREATE TABLE public.telegram_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id BIGINT NOT NULL,
  order_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours')
);

-- Create index for efficient lookups
CREATE INDEX idx_telegram_user_sessions_user_id ON public.telegram_user_sessions(user_id);
CREATE INDEX idx_telegram_user_sessions_expires_at ON public.telegram_user_sessions(expires_at);

-- Enable RLS
ALTER TABLE public.telegram_user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for system access (edge functions can manage sessions)
CREATE POLICY "System can manage telegram user sessions" 
ON public.telegram_user_sessions 
FOR ALL 
USING (true);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_telegram_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.telegram_user_sessions 
  WHERE expires_at < now();
END;
$$;