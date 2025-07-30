-- Remove the trigger and function for admin notifications
DROP TRIGGER IF EXISTS trigger_notify_admins_new_pending_product ON public.products;
DROP FUNCTION IF EXISTS public.notify_admins_new_pending_product();