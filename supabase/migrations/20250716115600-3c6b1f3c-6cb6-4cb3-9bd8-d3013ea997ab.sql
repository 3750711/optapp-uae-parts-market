-- Clean up all Telegram authentication components

-- Drop telegram_auth_logs table
DROP TABLE IF EXISTS public.telegram_auth_logs;

-- Remove telegram-related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS telegram_id,
DROP COLUMN IF EXISTS telegram_username,
DROP COLUMN IF EXISTS telegram_first_name,
DROP COLUMN IF EXISTS telegram_photo_url;

-- Remove telegram auth debug function if it exists
DROP FUNCTION IF EXISTS public.log_telegram_auth_debug(uuid, json);

-- Update auth_method to remove telegram options (keep it simple as 'email' or NULL)
UPDATE public.profiles 
SET auth_method = 'email' 
WHERE auth_method IN ('telegram', 'both');

-- Remove any telegram-related indexes or constraints that might exist
DROP INDEX IF EXISTS idx_profiles_telegram_id;
DROP INDEX IF EXISTS idx_telegram_auth_logs_telegram_id_auth_date;