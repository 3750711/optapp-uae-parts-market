-- Change order_media source default from 'telegram' to 'web'
ALTER TABLE public.order_media 
ALTER COLUMN source SET DEFAULT 'web';