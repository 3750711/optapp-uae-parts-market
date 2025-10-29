-- Create table for tracking shipment changes history
CREATE TABLE IF NOT EXISTS public.order_shipment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_shipment_id UUID NOT NULL REFERENCES public.order_shipments(id) ON DELETE CASCADE,
  changed_field VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_shipment_history_shipment_id 
  ON public.order_shipment_history(order_shipment_id);

CREATE INDEX IF NOT EXISTS idx_order_shipment_history_changed_at 
  ON public.order_shipment_history(changed_at DESC);

-- Enable RLS
ALTER TABLE public.order_shipment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all history
CREATE POLICY "Admins can view all shipment history"
  ON public.order_shipment_history
  FOR SELECT
  USING (is_current_user_admin());

-- Policy: Users can view history for their orders
CREATE POLICY "Users can view history for their orders"
  ON public.order_shipment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.order_shipments os
      JOIN public.orders o ON os.order_id = o.id
      WHERE os.id = order_shipment_history.order_shipment_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- Trigger function to log changes
CREATE OR REPLACE FUNCTION public.log_shipment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log container_number changes
  IF OLD.container_number IS DISTINCT FROM NEW.container_number THEN
    INSERT INTO public.order_shipment_history (
      order_shipment_id, 
      changed_field, 
      old_value, 
      new_value, 
      changed_by
    )
    VALUES (
      NEW.id, 
      'container_number', 
      OLD.container_number, 
      NEW.container_number, 
      auth.uid()
    );
  END IF;
  
  -- Log shipment_status changes
  IF OLD.shipment_status IS DISTINCT FROM NEW.shipment_status THEN
    INSERT INTO public.order_shipment_history (
      order_shipment_id, 
      changed_field, 
      old_value, 
      new_value, 
      changed_by
    )
    VALUES (
      NEW.id, 
      'shipment_status', 
      OLD.shipment_status::text, 
      NEW.shipment_status::text, 
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS track_shipment_changes ON public.order_shipments;

CREATE TRIGGER track_shipment_changes
  AFTER UPDATE ON public.order_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_shipment_changes();