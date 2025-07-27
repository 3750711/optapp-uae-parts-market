-- Remove duplicate notification triggers and functions
-- This will prevent duplicate Telegram notifications

-- Drop the duplicate trigger if it exists
DROP TRIGGER IF EXISTS trigger_product_status_notification ON public.products;

-- Drop the duplicate function if it exists  
DROP FUNCTION IF EXISTS public.create_product_status_notification() CASCADE;

-- Also remove any other duplicate triggers that might cause double notifications
DROP TRIGGER IF EXISTS product_status_notification_trigger ON public.products;