
-- Add Privacy Policy acceptance fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_privacy boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at timestamp with time zone;
