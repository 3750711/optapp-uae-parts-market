-- Add preferred_locale column to profiles table for language preference
ALTER TABLE public.profiles 
ADD COLUMN preferred_locale TEXT 
CHECK (preferred_locale IN ('ru', 'en', 'bn')) 
DEFAULT 'ru';

-- Add comment for the new column
COMMENT ON COLUMN public.profiles.preferred_locale IS 'User preferred language: ru (Russian), en (English), bn (Bengali). Only sellers can use bn.';

-- Create index for faster lookups
CREATE INDEX idx_profiles_preferred_locale ON public.profiles(preferred_locale) WHERE preferred_locale IS NOT NULL;