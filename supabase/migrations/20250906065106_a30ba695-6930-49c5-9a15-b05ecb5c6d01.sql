-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create app_settings table with secure configuration
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Insert base configuration
INSERT INTO public.app_settings (key, value)
VALUES ('functions_base_url', 'https://api.partsbay.ae/functions/v1')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Create secure RLS policies for app_settings (admin-only access)
CREATE POLICY app_settings_admin_select ON public.app_settings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY app_settings_admin_insert ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY app_settings_admin_update ON public.app_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY app_settings_admin_delete ON public.app_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Create public view for safe access to specific settings
CREATE OR REPLACE VIEW public.app_public_settings AS
SELECT key, value
FROM public.app_settings
WHERE key IN ('functions_base_url');

-- Grant access to the view
GRANT SELECT ON public.app_public_settings TO anon, authenticated;

-- Create secure functions_url function with proper error handling
CREATE OR REPLACE FUNCTION public.functions_url(p_path text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base text;
BEGIN
  SELECT value INTO base
  FROM public.app_settings
  WHERE key = 'functions_base_url';

  IF base IS NULL OR base = '' THEN
    RAISE EXCEPTION 'missing functions_base_url in app_settings';
  END IF;

  RETURN rtrim(base, '/') || '/' || ltrim(p_path, '/');
END;
$$;

-- Update notify_pusher_price_offer_changes function
CREATE OR REPLACE FUNCTION public.notify_pusher_price_offer_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  channel_name TEXT;
  event_data JSONB;
BEGIN
  -- Only notify on updates, not inserts
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Create channel name for the buyer
    channel_name := 'price-offer-' || NEW.buyer_id::text;
    
    -- Prepare event data
    event_data := jsonb_build_object(
      'offer_id', NEW.id,
      'product_id', NEW.product_id,
      'status', NEW.status,
      'seller_response', NEW.seller_response,
      'updated_at', NEW.updated_at
    );
    
    -- Send real-time notification via Edge Function (without authorization header)
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-pusher-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent for price offer % status change to %', NEW.id, NEW.status;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification for price offer %: %', NEW.id, SQLERRM;
    END;

    -- Also send notification to seller channel
    channel_name := 'price-offer-seller-' || NEW.seller_id::text;
    
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-pusher-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'channel', channel_name,
            'event', 'price-offer-updated',
            'data', event_data
          )
        );
      RAISE LOG 'Pusher notification sent to seller for price offer %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Pusher notification to seller for price offer %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update notify_seller_product_sold function
CREATE OR REPLACE FUNCTION public.notify_seller_product_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only notify when status changes to 'sold'
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'sold' THEN
    -- Send notification via Edge Function (without authorization header)
    BEGIN
      PERFORM
        net.http_post(
          url := public.functions_url('send-telegram-notification'),
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'product_id', NEW.id,
            'title', NEW.title,
            'seller_id', NEW.seller_id,
            'status', NEW.status,
            'lot_number', NEW.lot_number,
            'price', NEW.price
          )
        );
      RAISE LOG 'Telegram notification sent for sold product %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Error sending Telegram notification for product %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;