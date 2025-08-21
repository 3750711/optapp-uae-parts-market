-- Make entity_id nullable to allow logging events from unauthenticated users
ALTER TABLE public.event_logs 
ALTER COLUMN entity_id DROP NOT NULL;