-- Create atomic queue item fetcher with priority sorting and locking
CREATE OR REPLACE FUNCTION get_next_queue_item()
RETURNS SETOF notification_queue
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM notification_queue
  WHERE status = 'pending'
  AND scheduled_for <= NOW()
  ORDER BY 
    CASE priority 
      WHEN 'critical' THEN 1 
      WHEN 'high' THEN 2 
      WHEN 'normal' THEN 3 
      WHEN 'low' THEN 4 
      ELSE 5
    END ASC,
    created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
$$;