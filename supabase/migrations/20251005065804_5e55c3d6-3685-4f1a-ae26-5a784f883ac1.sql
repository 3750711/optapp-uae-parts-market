-- Step 1: Add optimization indexes for session monitoring system
-- (FK user_sessions_user_id_fkey already exists from previous migration)

-- Create index for user_sessions queries by user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
ON public.user_sessions(user_id);

-- Create optimized composite index for event_logs queries by session
-- This speeds up timeline queries: WHERE session_id = X ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_event_logs_session_created 
ON public.event_logs(session_id, created_at ASC) 
WHERE session_id IS NOT NULL;