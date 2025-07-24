-- Remove duplicate notification triggers to fix double Telegram notifications

-- Remove trigger and function for duplicate order status notifications
DROP TRIGGER IF EXISTS trigger_order_status_notification ON public.orders;
DROP FUNCTION IF EXISTS public.create_order_status_notification() CASCADE;

-- Remove trigger and function for duplicate new order notifications  
DROP TRIGGER IF EXISTS trigger_new_order_notification ON public.orders;
DROP FUNCTION IF EXISTS public.create_order_notification() CASCADE;

-- Keep only trigger_notify_on_new_order which calls Edge Function directly
-- This ensures single notification per order creation/status change