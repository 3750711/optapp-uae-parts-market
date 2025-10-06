-- ================================================================
-- Notification Queue System v2.0
-- Created: 2025-10-06
-- Purpose: Centralized queue for all Telegram notifications
-- ================================================================

-- Create notification_queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL CHECK (notification_type IN ('product', 'order', 'admin')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal', 'low')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  payload JSONB NOT NULL,
  request_id TEXT UNIQUE, -- For idempotency
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processing_time_ms INTEGER
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON public.notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON public.notification_queue(priority);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON public.notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_type ON public.notification_queue(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_queue_request_id ON public.notification_queue(request_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_created_at ON public.notification_queue(created_at);

-- Create composite index for queue processing
CREATE INDEX IF NOT EXISTS idx_notification_queue_processing 
ON public.notification_queue(status, priority, scheduled_for) 
WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Only admins can view queue"
ON public.notification_queue
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "System can manage queue"
ON public.notification_queue
FOR ALL
USING (current_setting('role') = 'service_role')
WITH CHECK (current_setting('role') = 'service_role');

-- Create materialized view for queue stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.notification_queue_stats AS
SELECT 
  notification_type,
  status,
  priority,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_processing_time_ms,
  MAX(processing_time_ms) as max_processing_time_ms,
  MIN(processing_time_ms) as min_processing_time_ms
FROM public.notification_queue
GROUP BY notification_type, status, priority;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_stats 
ON public.notification_queue_stats(notification_type, status, priority);

-- Function to get queue metrics
CREATE OR REPLACE FUNCTION public.get_queue_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_pending', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'pending'),
    'total_processing', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'processing'),
    'total_completed', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'completed'),
    'total_failed', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'failed'),
    'total_dead_letter', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'dead_letter'),
    'high_priority_pending', (SELECT COUNT(*) FROM public.notification_queue WHERE status = 'pending' AND priority = 'high'),
    'avg_processing_time_ms', (SELECT AVG(processing_time_ms) FROM public.notification_queue WHERE status = 'completed' AND processing_time_ms IS NOT NULL)
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to cleanup old completed notifications (older than 7 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.notification_queue
  WHERE status = 'completed'
  AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;

-- Function to retry dead letter notification
CREATE OR REPLACE FUNCTION public.retry_dead_letter_notification(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can retry dead letter notifications';
  END IF;

  -- Reset notification to pending
  UPDATE public.notification_queue
  SET 
    status = 'pending',
    attempts = 0,
    last_error = NULL,
    scheduled_for = NOW(),
    updated_at = NOW()
  WHERE id = p_notification_id
  AND status = 'dead_letter';
  
  RETURN FOUND;
END;
$$;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_notification_queue_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notification_queue_updated_at
BEFORE UPDATE ON public.notification_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_notification_queue_updated_at();

-- Grant permissions
GRANT SELECT ON public.notification_queue TO authenticated;
GRANT ALL ON public.notification_queue TO service_role;
GRANT SELECT ON public.notification_queue_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_queue_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION public.retry_dead_letter_notification(UUID) TO authenticated;

-- Add comment
COMMENT ON TABLE public.notification_queue IS 'Centralized queue for Telegram notifications v2.0 - handles products, orders, and admin notifications with priority and retry logic';