-- Step 1: Add notification status fields to products table
-- This allows tracking Telegram notification delivery without blocking product creation

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tg_notify_status text 
    NOT NULL DEFAULT 'pending'
    CHECK (tg_notify_status IN ('pending','sent','failed')),
  ADD COLUMN IF NOT EXISTS tg_notify_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tg_notify_error text;

-- Add index for efficient querying of pending notifications
CREATE INDEX IF NOT EXISTS idx_products_tg_notify_status 
ON public.products(tg_notify_status) 
WHERE tg_notify_status = 'pending';