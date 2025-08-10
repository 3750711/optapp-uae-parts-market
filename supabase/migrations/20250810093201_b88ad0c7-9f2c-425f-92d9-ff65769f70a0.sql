
BEGIN;

-- Remove the new welcome-on-profile-completion trigger and function to restore previous behavior
DROP TRIGGER IF EXISTS tr_notify_welcome_on_profile_completion ON public.profiles;
DROP FUNCTION IF EXISTS public.notify_welcome_on_profile_completion();

COMMIT;
