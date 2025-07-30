-- Enable HTTP extension for making external requests from triggers
CREATE EXTENSION IF NOT EXISTS http;

-- Create or update the service_role_key setting for edge function authentication
-- This allows triggers to call edge functions with proper authorization
INSERT INTO app.settings (name, value) 
VALUES ('service_role_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXlsZmxqaWl4cWtqZnF1YnlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDg5MTAyNSwiZXhwIjoyMDYwNDY3MDI1fQ.T4SYgL_sWWJ15nCrWLbYq_QkZzZhE5xmtw6iqHeFYWI')
ON CONFLICT (name) DO UPDATE SET value = EXCLUDED.value;

-- Update the product status change trigger function to use the http extension
CREATE OR REPLACE FUNCTION public.notify_on_product_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key TEXT;
  response RECORD;
BEGIN
  -- Only notify for status changes to 'active' or when marking as 'sold'
  IF (TG_OP = 'UPDATE' AND 
      (OLD.status != 'active' AND NEW.status = 'active') OR
      (OLD.status != 'sold' AND NEW.status = 'sold')) OR
     (TG_OP = 'INSERT' AND NEW.status = 'active' AND 
      (SELECT COUNT(*) FROM product_images WHERE product_id = NEW.id) >= 1) THEN
    
    -- Get service role key from settings
    SELECT value INTO service_role_key 
    FROM app.settings 
    WHERE name = 'service_role_key';
    
    -- Only proceed if we have images or it's a 'sold' status change
    IF (SELECT COUNT(*) FROM product_images WHERE product_id = NEW.id) >= 1 OR NEW.status = 'sold' THEN
      
      -- Make HTTP request to edge function
      SELECT INTO response * FROM http((
        'POST',
        'https://vfiylfljiixqkjfqubyq.supabase.co/functions/v1/send-telegram-notification',
        ARRAY[
          http_header('Content-Type', 'application/json'),
          http_header('Authorization', 'Bearer ' || service_role_key)
        ],
        'application/json',
        json_build_object(
          'productId', NEW.id,
          'notificationType', CASE 
            WHEN NEW.status = 'sold' THEN 'sold'
            ELSE 'status_change'
          END
        )::text
      ));
      
      -- Log the response for debugging
      RAISE LOG 'Telegram notification response: status=%, content=%', response.status, response.content;
      
      -- Update last notification timestamp on success
      IF response.status = 200 THEN
        UPDATE products SET last_notification_sent_at = NOW() WHERE id = NEW.id;
      ELSE
        RAISE LOG 'Failed to send Telegram notification: %', response.content;
      END IF;
      
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create app schema and settings table if they don't exist
CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.settings (
  name TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);