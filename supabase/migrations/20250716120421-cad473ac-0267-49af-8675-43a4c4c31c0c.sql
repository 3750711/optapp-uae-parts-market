-- Add telegram_id field to profiles table for Telegram Widget authentication
ALTER TABLE public.profiles 
ADD COLUMN telegram_id BIGINT;

-- Create unique index for telegram_id
CREATE UNIQUE INDEX idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;

-- Add unique constraint
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_telegram_id_unique UNIQUE (telegram_id);