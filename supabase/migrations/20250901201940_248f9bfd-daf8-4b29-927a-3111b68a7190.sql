-- Add missing tables to realtime publication to fix CHANNEL_ERROR issues
-- This enables realtime subscriptions for orders and profiles tables

-- Add orders table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Add profiles table to realtime publication  
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Set REPLICA IDENTITY FULL for orders table (ensures complete row data during updates)
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Set REPLICA IDENTITY FULL for profiles table (ensures complete row data during updates)
ALTER TABLE profiles REPLICA IDENTITY FULL;

-- Verify other tables are also in the publication (these should already be there)
-- Add price_offers if not already present
DO $$
BEGIN
    -- Check if price_offers is in the publication, add if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'price_offers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE price_offers;
        ALTER TABLE price_offers REPLICA IDENTITY FULL;
    END IF;
END
$$;

-- Add products table if not already present
DO $$
BEGIN
    -- Check if products is in the publication, add if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE products;
        ALTER TABLE products REPLICA IDENTITY FULL;
    END IF;
END
$$;

-- Add notifications table if not already present
DO $$
BEGIN
    -- Check if notifications is in the publication, add if not
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        ALTER TABLE notifications REPLICA IDENTITY FULL;
    END IF;
END
$$;