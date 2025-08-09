-- Add accepted_terms fields to profiles and ensure admin notification trigger exists

-- 1) Add columns for user agreement
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS accepted_terms boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;

-- 2) Create trigger to notify admins on new pending users (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_notify_admins_new_pending_user'
  ) THEN
    CREATE TRIGGER trg_notify_admins_new_pending_user
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admins_new_pending_user();
  END IF;
END $$;
