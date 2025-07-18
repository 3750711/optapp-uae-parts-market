-- Create price_offers table
CREATE TABLE public.price_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  original_price NUMERIC NOT NULL,
  offered_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'cancelled')),
  message TEXT,
  seller_response TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '6 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  UNIQUE(product_id, buyer_id, status) DEFERRABLE INITIALLY DEFERRED
);

-- Add new order type to existing enum
ALTER TYPE order_created_type ADD VALUE 'price_offer_order';

-- Enable RLS
ALTER TABLE public.price_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for price_offers
CREATE POLICY "Buyers can view their own offers" 
ON public.price_offers 
FOR SELECT 
USING (buyer_id = auth.uid());

CREATE POLICY "Sellers can view offers for their products" 
ON public.price_offers 
FOR SELECT 
USING (seller_id = auth.uid());

CREATE POLICY "Admins can view all offers" 
ON public.price_offers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'admin'
));

CREATE POLICY "Buyers can create offers" 
ON public.price_offers 
FOR INSERT 
WITH CHECK (
  buyer_id = auth.uid() 
  AND offered_price > 0 
  AND offered_price <= original_price
  AND EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id 
    AND status = 'active'
  )
);

CREATE POLICY "Sellers can update offers for their products" 
ON public.price_offers 
FOR UPDATE 
USING (seller_id = auth.uid())
WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins can update all offers" 
ON public.price_offers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() 
  AND user_type = 'admin'
));

CREATE POLICY "Buyers can cancel their own pending offers" 
ON public.price_offers 
FOR UPDATE 
USING (buyer_id = auth.uid() AND status = 'pending')
WITH CHECK (buyer_id = auth.uid() AND status = 'cancelled');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_price_offer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_price_offers_updated_at
BEFORE UPDATE ON public.price_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_price_offer_updated_at();

-- Function to expire old offers
CREATE OR REPLACE FUNCTION public.expire_old_price_offers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.price_offers
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' 
  AND expires_at < now();
END;
$$;