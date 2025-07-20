
-- Add RLS policy to allow buyers to update their own pending price offers
CREATE POLICY "Buyers can update their own pending offers" 
ON public.price_offers 
FOR UPDATE 
USING (buyer_id = auth.uid() AND status = 'pending')
WITH CHECK (buyer_id = auth.uid() AND status = 'pending');
