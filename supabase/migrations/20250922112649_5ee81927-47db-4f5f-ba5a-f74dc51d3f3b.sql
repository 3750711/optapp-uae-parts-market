-- Создание системы обучения ИИ на исправлениях модераторов

-- Таблица для хранения правил перевода/коррекции, извлеченных из исправлений модераторов
CREATE TABLE public.ai_translation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_phrase TEXT NOT NULL,
  corrected_phrase TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 1,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.8,
  rule_type TEXT NOT NULL DEFAULT 'translation',
  language_pair TEXT NOT NULL DEFAULT 'en_ru',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Индексы для быстрого поиска
CREATE INDEX idx_ai_translation_rules_original ON public.ai_translation_rules(original_phrase);
CREATE INDEX idx_ai_translation_rules_corrected ON public.ai_translation_rules(corrected_phrase);
CREATE INDEX idx_ai_translation_rules_usage ON public.ai_translation_rules(usage_count DESC);
CREATE INDEX idx_ai_translation_rules_active ON public.ai_translation_rules(is_active) WHERE is_active = true;

-- Таблица для детального анализа различий между предложениями ИИ и исправлениями модераторов
CREATE TABLE public.ai_correction_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  ai_suggestion TEXT NOT NULL,
  moderator_correction TEXT NOT NULL,
  differences JSONB NOT NULL DEFAULT '[]'::jsonb,
  extracted_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  moderator_id UUID REFERENCES auth.users(id),
  analysis_version TEXT NOT NULL DEFAULT '1.0'
);

-- Индекс для поиска анализа по продукту
CREATE INDEX idx_ai_correction_analysis_product ON public.ai_correction_analysis(product_id);
CREATE INDEX idx_ai_correction_analysis_processed ON public.ai_correction_analysis(processed_at DESC);

-- RLS политики для ai_translation_rules
ALTER TABLE public.ai_translation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage translation rules" ON public.ai_translation_rules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

CREATE POLICY "System can read translation rules" ON public.ai_translation_rules
FOR SELECT USING (is_active = true);

-- RLS политики для ai_correction_analysis
ALTER TABLE public.ai_correction_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage correction analysis" ON public.ai_correction_analysis
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Функция для автоматического извлечения правил перевода из исправлений
CREATE OR REPLACE FUNCTION public.extract_translation_rules(
  p_ai_suggestion TEXT,
  p_moderator_correction TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rules JSONB := '[]'::jsonb;
  ai_words TEXT[];
  mod_words TEXT[];
  i INTEGER;
BEGIN
  -- Простой анализ различий по словам
  ai_words := string_to_array(p_ai_suggestion, ' ');
  mod_words := string_to_array(p_moderator_correction, ' ');
  
  -- Если длина примерно одинаковая, ищем замены
  IF abs(array_length(ai_words, 1) - array_length(mod_words, 1)) <= 2 THEN
    FOR i IN 1..LEAST(array_length(ai_words, 1), array_length(mod_words, 1)) LOOP
      IF ai_words[i] != mod_words[i] AND 
         length(ai_words[i]) > 2 AND 
         length(mod_words[i]) > 2 THEN
        rules := rules || jsonb_build_object(
          'from', trim(ai_words[i]),
          'to', trim(mod_words[i]),
          'type', 'word_replacement',
          'confidence', 0.7
        );
      END IF;
    END LOOP;
  END IF;
  
  -- Поиск фразовых замен (простая версия)
  IF p_ai_suggestion ILIKE '%носовая часть%' AND p_moderator_correction ILIKE '%nose cut%' THEN
    rules := rules || jsonb_build_object(
      'from', 'носовая часть',
      'to', 'nose cut',
      'type', 'phrase_replacement',
      'confidence', 0.9
    );
  END IF;
  
  IF p_ai_suggestion ILIKE '%цифровое боковое зеркало%' AND p_moderator_correction ILIKE '%боковое зеркало%' THEN
    rules := rules || jsonb_build_object(
      'from', 'цифровое боковое зеркало',
      'to', 'боковое зеркало',
      'type', 'phrase_simplification',
      'confidence', 0.9
    );
  END IF;
  
  RETURN rules;
END;
$$;

-- Функция для применения правил перевода к тексту
CREATE OR REPLACE FUNCTION public.apply_translation_rules(
  p_text TEXT,
  p_limit INTEGER DEFAULT 50
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_text TEXT := p_text;
  rule_record RECORD;
BEGIN
  -- Применяем активные правила в порядке убывания usage_count
  FOR rule_record IN 
    SELECT original_phrase, corrected_phrase
    FROM public.ai_translation_rules
    WHERE is_active = true
    ORDER BY usage_count DESC, confidence_score DESC
    LIMIT p_limit
  LOOP
    result_text := replace(result_text, rule_record.original_phrase, rule_record.corrected_phrase);
  END LOOP;
  
  RETURN result_text;
END;
$$;

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION public.update_ai_translation_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_translation_rules_updated_at
  BEFORE UPDATE ON public.ai_translation_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ai_translation_rules_updated_at();