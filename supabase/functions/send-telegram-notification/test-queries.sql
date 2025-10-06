-- ============================================
-- SQL Queries for Testing Notification Queue
-- ============================================

-- 1. Check queue metrics
SELECT * FROM get_queue_metrics();

-- 2. View all items in queue (last 20)
SELECT 
  id,
  notification_type,
  priority,
  status,
  attempts,
  scheduled_for,
  created_at,
  processing_time_ms,
  last_error
FROM notification_queue 
ORDER BY created_at DESC 
LIMIT 20;

-- 3. View pending items
SELECT 
  id,
  notification_type,
  priority,
  payload,
  scheduled_for,
  created_at
FROM notification_queue 
WHERE status = 'pending'
ORDER BY 
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'normal' THEN 2
    WHEN 'low' THEN 3
  END,
  created_at ASC;

-- 4. View processing items
SELECT 
  id,
  notification_type,
  priority,
  attempts,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_in_processing
FROM notification_queue 
WHERE status = 'processing'
ORDER BY updated_at DESC;

-- 5. View completed items (last 10)
SELECT 
  id,
  notification_type,
  priority,
  processing_time_ms,
  processed_at,
  payload
FROM notification_queue 
WHERE status = 'completed'
ORDER BY processed_at DESC 
LIMIT 10;

-- 6. View failed items
SELECT 
  id,
  notification_type,
  priority,
  attempts,
  last_error,
  payload,
  updated_at
FROM notification_queue 
WHERE status = 'failed'
ORDER BY updated_at DESC;

-- 7. View dead letter queue
SELECT 
  id,
  notification_type,
  priority,
  attempts,
  last_error,
  payload,
  created_at
FROM notification_queue 
WHERE status = 'dead_letter'
ORDER BY created_at DESC;

-- 8. View queue statistics by type and priority
SELECT 
  notification_type,
  priority,
  status,
  COUNT(*) as count,
  AVG(processing_time_ms) as avg_time_ms,
  MAX(processing_time_ms) as max_time_ms,
  MIN(processing_time_ms) as min_time_ms
FROM notification_queue
WHERE processing_time_ms IS NOT NULL
GROUP BY notification_type, priority, status
ORDER BY notification_type, priority;

-- 9. Check product notification status
SELECT 
  id,
  title,
  tg_notify_status,
  tg_notify_attempts,
  last_notification_sent_at,
  EXTRACT(EPOCH FROM (NOW() - last_notification_sent_at))/3600 as hours_since_last,
  CASE 
    WHEN last_notification_sent_at IS NULL THEN 'Never sent'
    WHEN EXTRACT(EPOCH FROM (NOW() - last_notification_sent_at))/3600 < 72 THEN 'In cooldown'
    ELSE 'Can send'
  END as cooldown_status
FROM products 
WHERE tg_notify_status IS NOT NULL
ORDER BY updated_at DESC 
LIMIT 20;

-- 10. Find stuck items (processing > 5 minutes)
SELECT 
  id,
  notification_type,
  priority,
  attempts,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
FROM notification_queue 
WHERE status = 'processing' 
AND updated_at < NOW() - INTERVAL '5 minutes'
ORDER BY updated_at ASC;

-- 11. Reset stuck items (USE WITH CAUTION)
-- UPDATE notification_queue 
-- SET status = 'pending', attempts = attempts + 1 
-- WHERE status = 'processing' 
-- AND updated_at < NOW() - INTERVAL '5 minutes';

-- 12. Retry a specific dead letter item
-- SELECT retry_dead_letter_notification('queue-item-uuid-here');

-- 13. Cleanup old completed notifications (older than 7 days)
-- SELECT cleanup_old_notifications();

-- 14. View materialized view stats
SELECT * FROM notification_queue_stats
ORDER BY notification_type, priority, status;

-- 15. Refresh materialized view
-- REFRESH MATERIALIZED VIEW notification_queue_stats;

-- 16. Performance check: Queue processing rate
SELECT 
  DATE_TRUNC('hour', processed_at) as hour,
  COUNT(*) as completed_count,
  AVG(processing_time_ms) as avg_time_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as median_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_time_ms
FROM notification_queue 
WHERE status = 'completed'
AND processed_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', processed_at)
ORDER BY hour DESC;

-- 17. Check for duplicate requests (idempotency)
SELECT 
  request_id,
  COUNT(*) as count,
  MIN(created_at) as first_attempt,
  MAX(created_at) as last_attempt
FROM notification_queue
WHERE request_id IS NOT NULL
GROUP BY request_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 18. Error analysis
SELECT 
  last_error,
  COUNT(*) as occurrences,
  MAX(updated_at) as last_seen
FROM notification_queue
WHERE last_error IS NOT NULL
GROUP BY last_error
ORDER BY occurrences DESC
LIMIT 10;
