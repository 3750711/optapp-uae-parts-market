-- Add foreign key constraint between orders.container_number and containers.container_number
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_container_number 
FOREIGN KEY (container_number) 
REFERENCES public.containers(container_number)
ON DELETE SET NULL
ON UPDATE CASCADE;