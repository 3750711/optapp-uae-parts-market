-- ============================================================================
-- Phase 1: Database Foundation for Activity Monitoring System
-- ============================================================================
-- This migration adds performance indexes and system metadata tracking
-- ============================================================================

-- ============================================================================
-- 1. Add indexes for event_logs table (performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id 
  ON event_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_event_logs_created_at 
  ON event_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_action_type 
  ON event_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_created 
  ON event_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_logs_entity 
  ON event_logs(entity_type, entity_id);

-- ============================================================================
-- 2. Add indexes for user_sessions table (performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id 
  ON user_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at 
  ON user_sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_termination 
  ON user_sessions(termination_reason);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
  ON user_sessions(user_id, termination_reason) 
  WHERE termination_reason = 'active';

-- ============================================================================
-- 3. Add indexes for telegram_notifications_log table (performance optimization)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_telegram_log_created 
  ON telegram_notifications_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_telegram_log_status 
  ON telegram_notifications_log(status);

CREATE INDEX IF NOT EXISTS idx_telegram_log_recipient 
  ON telegram_notifications_log(recipient_identifier);

-- ============================================================================
-- 4. Create system_metadata table for system state tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add helpful comment
COMMENT ON TABLE system_metadata IS 'Stores system-level metadata for tracking internal state and configurations';

-- ============================================================================
-- 5. Enable RLS and create policies for system_metadata
-- ============================================================================

ALTER TABLE system_metadata ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for automated jobs)
CREATE POLICY "Allow service role full access to system_metadata"
  ON system_metadata FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read system metadata
CREATE POLICY "Allow authenticated users read access to system_metadata"
  ON system_metadata FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage system metadata
CREATE POLICY "Allow admins to manage system_metadata"
  ON system_metadata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- ============================================================================
-- 6. Initialize system_metadata with default values
-- ============================================================================

-- Set initial timestamp for session computation (30 days ago)
INSERT INTO system_metadata (key, value) 
VALUES (
  'last_session_compute_time', 
  (NOW() - INTERVAL '30 days')::TEXT
)
ON CONFLICT (key) DO NOTHING;

-- Add system version tracking
INSERT INTO system_metadata (key, value)
VALUES ('monitoring_system_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- Track when the monitoring system was initialized
INSERT INTO system_metadata (key, value)
VALUES ('monitoring_initialized_at', NOW()::TEXT)
ON CONFLICT (key) DO NOTHING;