-- Create table for centralized telegram accounts configuration
CREATE TABLE public.telegram_accounts_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telegram_username TEXT NOT NULL UNIQUE,
  is_local BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.telegram_accounts_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Only admins can manage telegram accounts config" 
ON public.telegram_accounts_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND user_type = 'admin'
  )
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION public.update_telegram_accounts_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_telegram_accounts_config_updated_at
BEFORE UPDATE ON public.telegram_accounts_config
FOR EACH ROW
EXECUTE FUNCTION public.update_telegram_accounts_config_updated_at();

-- Insert existing local accounts from the hardcoded list
INSERT INTO public.telegram_accounts_config (telegram_username, is_local) VALUES
('optseller_anton', true),
('optseller_georgii', true),
('igord_optseller', true),
('optseller_igork', true),
('pavel_optuae', true),
('sansanichuae', true),
('dmotrii_st', true),
('optseller_vlad', true),
('localseller_ali', true),
('faruknose', true),
('faruk', true),
('faiznose', true),
('localseller_jahangir', true),
('localseller_pochemy', true),
('localseller_rakib', true),
('localseller_sharif', true),
('localseller_younus', true);