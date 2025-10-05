-- Add session_id column to event_logs table
ALTER TABLE public.event_logs 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_event_logs_session_id ON public.event_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_user_created ON public.event_logs(user_id, created_at);