-- Remove old password reset system components

-- Drop old tables
DROP TABLE IF EXISTS password_reset_codes CASCADE;
DROP TABLE IF EXISTS security_logs CASCADE;
DROP TABLE IF EXISTS rate_limits CASCADE;

-- Drop old functions
DROP FUNCTION IF EXISTS send_password_reset_code(text, text, inet) CASCADE;
DROP FUNCTION IF EXISTS verify_reset_code(text, text) CASCADE;
DROP FUNCTION IF EXISTS check_ip_rate_limit(inet, text, integer, interval) CASCADE;
DROP FUNCTION IF EXISTS log_security_event(text, text, text, jsonb, inet) CASCADE;

-- Keep the simplified get_email_by_opt_id function (already exists and works)