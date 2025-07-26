-- Add multilingual support to notifications table
ALTER TABLE public.notifications 
ADD COLUMN title_en TEXT,
ADD COLUMN message_en TEXT,
ADD COLUMN language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'en'));

-- Create index for better performance
CREATE INDEX idx_notifications_language ON public.notifications(language);
CREATE INDEX idx_notifications_user_language ON public.notifications(user_id, language);

-- Update existing notifications to have Russian language
UPDATE public.notifications SET language = 'ru' WHERE language IS NULL;