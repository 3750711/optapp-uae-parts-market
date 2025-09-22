-- Создаем таблицу для сохранения исправлений модератора для обучения AI
CREATE TABLE public.ai_moderation_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ai_original_title TEXT NOT NULL,
  ai_suggested_title TEXT,
  ai_suggested_brand TEXT,
  ai_suggested_model TEXT,
  moderator_corrected_title TEXT NOT NULL,
  moderator_corrected_brand TEXT,
  moderator_corrected_model TEXT,
  ai_confidence NUMERIC,
  correction_type TEXT NOT NULL DEFAULT 'manual_review',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.ai_moderation_corrections ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Only admins can manage AI corrections" ON public.ai_moderation_corrections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Индексы для лучшей производительности
CREATE INDEX idx_ai_moderation_corrections_product_id ON public.ai_moderation_corrections(product_id);
CREATE INDEX idx_ai_moderation_corrections_created_at ON public.ai_moderation_corrections(created_at DESC);
CREATE INDEX idx_ai_moderation_corrections_moderator_id ON public.ai_moderation_corrections(moderator_id);