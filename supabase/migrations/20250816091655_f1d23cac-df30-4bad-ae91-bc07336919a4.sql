-- Create containers table for centralized container management
CREATE TABLE public.containers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  container_number TEXT NOT NULL UNIQUE,
  status container_status NOT NULL DEFAULT 'waiting',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;

-- Create policies for containers
CREATE POLICY "Only admins can manage containers"
ON public.containers
FOR ALL
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_containers_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create function to update container status and sync all related orders
CREATE OR REPLACE FUNCTION public.update_container_status_and_sync(
  p_container_number TEXT,
  p_new_status container_status
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT is_current_user_admin() THEN
    RAISE EXCEPTION 'Only admins can update container statuses';
  END IF;

  -- Update container status
  UPDATE public.containers
  SET status = p_new_status, updated_at = now()
  WHERE container_number = p_container_number;

  -- Update all related order shipments
  UPDATE public.order_shipments
  SET container_status = p_new_status, updated_at = now()
  WHERE container_number = p_container_number;

  -- Log the action
  RAISE LOG 'Container % status updated to % and synced to all related orders', p_container_number, p_new_status;
END;
$$;

-- Create function to sync container status when container_number is added to order_shipments
CREATE OR REPLACE FUNCTION public.sync_container_status_on_shipment_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  container_status_val container_status;
BEGIN
  -- If container_number is being set and it exists in containers table
  IF NEW.container_number IS NOT NULL AND NEW.container_number != '' THEN
    SELECT status INTO container_status_val
    FROM public.containers
    WHERE container_number = NEW.container_number;
    
    -- If container exists, sync its status
    IF FOUND THEN
      NEW.container_status = container_status_val;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic container status sync
CREATE TRIGGER sync_container_status_trigger
  BEFORE INSERT OR UPDATE ON public.order_shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_container_status_on_shipment_update();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_containers_updated_at
  BEFORE UPDATE ON public.containers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_containers_updated_at();

-- Migrate existing container data
INSERT INTO public.containers (container_number, status, description)
SELECT DISTINCT 
  container_number,
  container_status,
  'Migrated from existing data'
FROM public.order_shipments 
WHERE container_number IS NOT NULL 
  AND container_number != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.containers c 
    WHERE c.container_number = order_shipments.container_number
  );