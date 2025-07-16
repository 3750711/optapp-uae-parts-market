-- Fix RLS policy for telegram_auth_logs to allow service role inserts
DROP POLICY IF EXISTS "System manages telegram auth logs" ON public.telegram_auth_logs;

-- Create a simple policy that allows service role to insert logs
CREATE POLICY "Allow service role to insert auth logs" 
ON public.telegram_auth_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow service role to read logs for replay attack prevention
CREATE POLICY "Allow service role to read auth logs" 
ON public.telegram_auth_logs 
FOR SELECT 
USING (true);