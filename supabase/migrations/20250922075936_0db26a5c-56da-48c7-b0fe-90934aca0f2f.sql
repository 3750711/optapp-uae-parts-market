-- Фаза 1: Добавление полей для AI предложений в products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS ai_suggested_title TEXT,
ADD COLUMN IF NOT EXISTS ai_suggested_brand TEXT,
ADD COLUMN IF NOT EXISTS ai_suggested_model TEXT;

-- Добавление поля was_ai_accepted в ai_moderation_corrections  
ALTER TABLE public.ai_moderation_corrections
ADD COLUMN IF NOT EXISTS was_ai_accepted BOOLEAN DEFAULT false;

-- Комментарии для ясности
COMMENT ON COLUMN public.products.ai_suggested_title IS 'AI предложение названия товара (не применяется автоматически)';
COMMENT ON COLUMN public.products.ai_suggested_brand IS 'AI предложение марки (не применяется автоматически)';
COMMENT ON COLUMN public.products.ai_suggested_model IS 'AI предложение модели (не применяется автоматически)';
COMMENT ON COLUMN public.ai_moderation_corrections.was_ai_accepted IS 'Принял ли модератор AI предложения целиком';