
-- Fix REPLICA IDENTITY for price_offers table to ensure full row data in real-time updates
ALTER TABLE public.price_offers REPLICA IDENTITY FULL;

-- Verify the change was applied correctly
SELECT schemaname, tablename, attrelid, relreplident 
FROM pg_stat_user_tables 
JOIN pg_class ON pg_stat_user_tables.relid = pg_class.oid 
WHERE schemaname = 'public' AND tablename = 'price_offers';

-- Also ensure the table is properly configured for real-time
-- Check if table is in realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' AND tablename = 'price_offers';

-- If not in publication, add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'price_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.price_offers;
  END IF;
END $$;
