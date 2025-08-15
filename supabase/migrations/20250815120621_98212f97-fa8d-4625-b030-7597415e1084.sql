-- Create search_synonyms table for storing search term synonyms
CREATE TABLE public.search_synonyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_term TEXT NOT NULL,
  synonym TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- 'brand', 'model', 'part', 'general'
  language TEXT NOT NULL DEFAULT 'ru', -- 'ru', 'en'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id),
  
  -- Ensure unique combinations
  UNIQUE(original_term, synonym, language)
);

-- Create indexes for fast searching
CREATE INDEX idx_search_synonyms_original_term ON public.search_synonyms(original_term);
CREATE INDEX idx_search_synonyms_synonym ON public.search_synonyms(synonym);
CREATE INDEX idx_search_synonyms_category ON public.search_synonyms(category);
CREATE INDEX idx_search_synonyms_language ON public.search_synonyms(language);

-- Enable RLS
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view synonyms" 
ON public.search_synonyms 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage synonyms" 
ON public.search_synonyms 
FOR ALL 
USING (is_current_user_admin());

-- Insert some initial popular synonyms for auto parts
INSERT INTO public.search_synonyms (original_term, synonym, category, language) VALUES
-- Engine synonyms (Russian)
('двигатель', 'мотор', 'part', 'ru'),
('двигатель', 'движок', 'part', 'ru'),
('двигатель', 'engine', 'part', 'ru'),
('двигатель', 'двс', 'part', 'ru'),
('мотор', 'двигатель', 'part', 'ru'),
('мотор', 'движок', 'part', 'ru'),
('движок', 'двигатель', 'part', 'ru'),
('движок', 'мотор', 'part', 'ru'),

-- Engine synonyms (English)
('engine', 'motor', 'part', 'en'),
('engine', 'двигатель', 'part', 'en'),
('motor', 'engine', 'part', 'en'),

-- Body parts (Russian)
('ноускат', 'nose cut', 'part', 'ru'),
('ноускат', 'передняя часть', 'part', 'ru'),
('ноускат', 'морда', 'part', 'ru'),
('морда', 'ноускат', 'part', 'ru'),
('морда', 'передняя часть', 'part', 'ru'),

-- BMW brand synonyms
('bmw', 'бмв', 'brand', 'ru'),
('bmw', 'бимер', 'brand', 'ru'),
('бмв', 'bmw', 'brand', 'ru'),
('бмв', 'бимер', 'brand', 'ru'),
('бимер', 'bmw', 'brand', 'ru'),
('бимер', 'бмв', 'brand', 'ru'),

-- Toyota synonyms
('toyota', 'тойота', 'brand', 'ru'),
('тойота', 'toyota', 'brand', 'ru'),

-- Mercedes synonyms
('mercedes', 'мерседес', 'brand', 'ru'),
('mercedes-benz', 'мерседес', 'brand', 'ru'),
('мерседес', 'mercedes', 'brand', 'ru'),
('мерседес', 'mercedes-benz', 'brand', 'ru'),

-- Common parts
('кпп', 'коробка передач', 'part', 'ru'),
('кпп', 'трансмиссия', 'part', 'ru'),
('коробка передач', 'кпп', 'part', 'ru'),
('коробка передач', 'трансмиссия', 'part', 'ru'),
('акпп', 'автомат', 'part', 'ru'),
('акпп', 'автоматическая коробка', 'part', 'ru'),
('автомат', 'акпп', 'part', 'ru'),

-- Lights
('фара', 'фонарь', 'part', 'ru'),
('фара', 'headlight', 'part', 'ru'),
('фонарь', 'фара', 'part', 'ru'),
('стоп', 'стоп-сигнал', 'part', 'ru'),
('стоп', 'задний фонарь', 'part', 'ru'),

-- Wheels
('диск', 'колесный диск', 'part', 'ru'),
('диск', 'wheel', 'part', 'ru'),
('резина', 'шина', 'part', 'ru'),
('резина', 'покрышка', 'part', 'ru'),
('шина', 'резина', 'part', 'ru'),
('шина', 'покрышка', 'part', 'ru');

-- Create function to get synonyms for a search term
CREATE OR REPLACE FUNCTION get_search_synonyms(search_term TEXT, search_language TEXT DEFAULT 'ru')
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  synonyms TEXT[];
BEGIN
  -- Get all synonyms for the given term
  SELECT ARRAY_AGG(DISTINCT synonym)
  INTO synonyms
  FROM search_synonyms
  WHERE (original_term ILIKE search_term OR synonym ILIKE search_term)
    AND language = search_language;
  
  -- Return the array, or empty array if no synonyms found
  RETURN COALESCE(synonyms, ARRAY[]::TEXT[]);
END;
$$;