-- Удаляем функционал редактирования промта

-- Удаляем запись с основным промтом из app_settings
DELETE FROM public.app_settings WHERE key = 'ai_prompt_main';

-- Удаляем таблицу административных правил для промта
DROP TABLE IF EXISTS public.ai_prompt_admin_rules;