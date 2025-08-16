-- Remove container_status column from orders table since we'll use JOINs with containers table
ALTER TABLE public.orders DROP COLUMN IF EXISTS container_status;