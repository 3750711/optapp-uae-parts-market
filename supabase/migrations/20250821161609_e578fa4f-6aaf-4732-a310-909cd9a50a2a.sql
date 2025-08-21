-- Create RLS policy to allow system logging to event_logs table
CREATE POLICY "Allow system logging to event_logs" 
ON public.event_logs 
FOR INSERT 
WITH CHECK (true);

-- Allow authenticated users to view their own event logs
CREATE POLICY "Users can view their own event logs" 
ON public.event_logs 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);