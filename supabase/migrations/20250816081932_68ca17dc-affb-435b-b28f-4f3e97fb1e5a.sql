-- Create order_shipments table for managing individual places/containers
CREATE TABLE public.order_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  place_number INTEGER NOT NULL,
  container_number TEXT,
  shipment_status shipment_status NOT NULL DEFAULT 'not_shipped',
  container_status container_status DEFAULT 'waiting',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(order_id, place_number)
);

-- Enable RLS on order_shipments
ALTER TABLE public.order_shipments ENABLE ROW LEVEL SECURITY;

-- Create policies for order_shipments
CREATE POLICY "Users can view order shipments for their orders"
ON public.order_shipments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_shipments.order_id
    AND (orders.buyer_id = auth.uid() OR orders.seller_id = auth.uid() OR is_current_user_admin())
  )
);

CREATE POLICY "Admins can manage all order shipments"
ON public.order_shipments
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_order_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_shipments_updated_at
BEFORE UPDATE ON public.order_shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_order_shipments_updated_at();

-- Create function to automatically create order_shipments when order is created
CREATE OR REPLACE FUNCTION public.create_order_shipments()
RETURNS TRIGGER AS $$
BEGIN
  -- Create shipment records for each place_number
  INSERT INTO public.order_shipments (order_id, place_number, container_number, shipment_status, container_status)
  SELECT 
    NEW.id,
    generate_series(1, NEW.place_number),
    NEW.container_number,
    NEW.shipment_status,
    NEW.container_status;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create order_shipments on order insert
CREATE TRIGGER create_order_shipments_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_order_shipments();

-- Migrate existing orders to order_shipments
INSERT INTO public.order_shipments (order_id, place_number, container_number, shipment_status, container_status, created_at, updated_at)
SELECT 
  id as order_id,
  generate_series(1, place_number) as place_number,
  container_number,
  COALESCE(shipment_status, 'not_shipped') as shipment_status,
  COALESCE(container_status, 'waiting') as container_status,
  created_at,
  created_at as updated_at
FROM public.orders
WHERE NOT EXISTS (
  SELECT 1 FROM public.order_shipments 
  WHERE order_shipments.order_id = orders.id
);