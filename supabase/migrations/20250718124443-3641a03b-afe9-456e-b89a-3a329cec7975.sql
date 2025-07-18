-- Optimize notifications table for better performance
-- Add composite index for user_id and created_at for faster fetching
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON public.notifications (user_id, created_at DESC);

-- Add index for read status queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON public.notifications (user_id, read) 
WHERE read = false;

-- Add index for real-time queries
CREATE INDEX IF NOT EXISTS idx_notifications_updated 
ON public.notifications (updated_at DESC);

-- Analyze table to update statistics for query planner
ANALYZE public.notifications;