-- Create table for AI prompt admin rules
CREATE TABLE public.ai_prompt_admin_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_text text NOT NULL,
  rule_category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_prompt_admin_rules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage AI prompt rules
CREATE POLICY "Only admins can manage AI prompt rules" 
ON public.ai_prompt_admin_rules 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Insert some default rules
INSERT INTO public.ai_prompt_admin_rules (rule_text, rule_category, display_order) VALUES
('Носовая часть → всегда переводи как "Nose cut"', 'translations', 1),
('engene→engine, bamper→bumper, transmision→transmission', 'spelling', 2),
('КОДЫ ДЕТАЛЕЙ НЕ ЯВЛЯЮТСЯ МОДЕЛЯМИ: 1ZZ, 2JZ, K20A - это коды двигателей, НЕ модели', 'part_codes', 3);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION public.update_ai_prompt_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ai_prompt_rules_updated_at
BEFORE UPDATE ON public.ai_prompt_admin_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_ai_prompt_rules_updated_at();