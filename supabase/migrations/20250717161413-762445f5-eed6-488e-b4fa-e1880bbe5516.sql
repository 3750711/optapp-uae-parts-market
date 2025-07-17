-- Enable realtime for event_logs table
ALTER TABLE public.event_logs REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.event_logs;