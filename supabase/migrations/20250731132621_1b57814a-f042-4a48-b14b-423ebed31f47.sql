-- Remove the duplicate trigger that causes double notifications
DROP TRIGGER IF EXISTS price_offer_notification_trigger ON public.price_offers;