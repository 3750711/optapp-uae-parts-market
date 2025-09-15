-- Create IP-based rate limiting function
CREATE OR REPLACE FUNCTION public.check_ip_rate_limit(
  p_ip_address TEXT,
  p_action TEXT,
  p_limit INTEGER DEFAULT 10,
  p_window_hours INTEGER DEFAULT 1
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count INTEGER;
  window_start TIMESTAMP;
BEGIN
  -- Calculate window start time
  window_start := NOW() - (p_window_hours || ' hours')::INTERVAL;
  
  -- Count attempts in the time window
  SELECT COUNT(*)
  INTO attempt_count
  FROM public.security_logs
  WHERE ip_address = p_ip_address
    AND event_type LIKE p_action || '%'
    AND created_at >= window_start;
  
  -- Check if limit exceeded
  IF attempt_count >= p_limit THEN
    RETURN json_build_object(
      'allowed', false,
      'remaining', 0,
      'reset_time', EXTRACT(EPOCH FROM (window_start + (p_window_hours || ' hours')::INTERVAL))
    );
  END IF;
  
  RETURN json_build_object(
    'allowed', true,
    'remaining', p_limit - attempt_count,
    'reset_time', EXTRACT(EPOCH FROM (window_start + (p_window_hours || ' hours')::INTERVAL))
  );
END;
$$;

-- Create function to clean old security logs (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.security_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RAISE LOG 'Cleaned up % old security log entries', deleted_count;
  
  RETURN deleted_count;
END;
$$;