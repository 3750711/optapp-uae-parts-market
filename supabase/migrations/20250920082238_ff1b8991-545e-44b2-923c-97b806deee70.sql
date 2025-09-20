-- Create user_sessions table for storing computed session data
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  last_activity_time TIMESTAMPTZ,
  termination_reason TEXT CHECK (termination_reason IN ('active', 'explicit_logout', 'new_login', 'timeout', 'forced_logout')),
  termination_details TEXT,
  session_timeout_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key reference to auth.users (note: this is safe as it references Supabase's auth schema)
-- We use user_id to reference auth.users.id but don't enforce FK constraint to avoid issues
-- Instead we'll handle this in application logic and RLS policies

-- Add indexes for performance
CREATE INDEX idx_user_sessions_user_started ON public.user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_termination ON public.user_sessions(termination_reason);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id) WHERE ended_at IS NULL;
CREATE INDEX idx_user_sessions_timerange ON public.user_sessions(started_at, ended_at);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can manage all user sessions" 
ON public.user_sessions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "Users can view their own sessions" 
ON public.user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_user_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_sessions_updated_at
BEFORE UPDATE ON public.user_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_sessions_updated_at();