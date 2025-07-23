
-- Fix REPLICA IDENTITY for price_offers table to ensure full row data is sent in UPDATE events
ALTER TABLE public.price_offers REPLICA IDENTITY FULL;

-- Verify the change
SELECT relreplident FROM pg_class WHERE relname = 'price_offers';
-- Should return 'f' for FULL (not 'd' for default)

-- Also ensure the table is properly in the realtime publication
-- (This should already be done, but let's verify)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'price_offers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.price_offers;
  END IF;
END $$;
