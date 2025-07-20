
-- Enable realtime for price_offers table
ALTER TABLE public.price_offers REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER publication supabase_realtime ADD TABLE public.price_offers;
