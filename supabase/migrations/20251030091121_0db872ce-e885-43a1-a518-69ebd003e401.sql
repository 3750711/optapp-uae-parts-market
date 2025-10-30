-- Add ready_for_shipment column to orders table
ALTER TABLE public.orders 
ADD COLUMN ready_for_shipment BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster filtering
CREATE INDEX idx_orders_ready_for_shipment ON public.orders(ready_for_shipment) 
WHERE ready_for_shipment = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.ready_for_shipment IS 
'Флаг готовности заказа к отправке. Устанавливается администратором для планирования погрузки контейнера.';