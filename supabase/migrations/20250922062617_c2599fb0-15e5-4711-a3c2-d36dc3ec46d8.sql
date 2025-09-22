-- Фаза 1: Добавляем AI поля в products
ALTER TABLE public.products 
ADD COLUMN ai_confidence DECIMAL(3,2),
ADD COLUMN ai_enriched_at TIMESTAMPTZ,
ADD COLUMN ai_original_title TEXT,
ADD COLUMN requires_moderation BOOLEAN DEFAULT true;

-- Создаем таблицу логов AI обработки
CREATE TABLE public.ai_enrichment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  input_data JSONB NOT NULL,
  ai_response JSONB NOT NULL,
  confidence DECIMAL(3,2),
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создаем таблицу данных для обучения AI
CREATE TABLE public.ai_training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  corrected_text TEXT NOT NULL,
  brand_detected TEXT,
  model_detected TEXT,
  moderator_corrections JSONB,
  moderator_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS политики для ai_enrichment_logs
ALTER TABLE public.ai_enrichment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage AI logs" ON public.ai_enrichment_logs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- RLS политики для ai_training_data
ALTER TABLE public.ai_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage training data" ON public.ai_training_data
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Индексы для производительности
CREATE INDEX idx_ai_enrichment_logs_product_id ON public.ai_enrichment_logs(product_id);
CREATE INDEX idx_ai_enrichment_logs_created_at ON public.ai_enrichment_logs(created_at);
CREATE INDEX idx_ai_training_data_moderator_id ON public.ai_training_data(moderator_id);
CREATE INDEX idx_products_ai_confidence ON public.products(ai_confidence);
CREATE INDEX idx_products_requires_moderation ON public.products(requires_moderation);