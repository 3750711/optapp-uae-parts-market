-- Create help_categories table
CREATE TABLE public.help_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'HelpCircle',
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create help_items table
CREATE TABLE public.help_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.help_categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for help_categories
CREATE POLICY "Public can view help categories" 
ON public.help_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage help categories" 
ON public.help_categories 
FOR ALL 
USING (is_current_user_admin());

-- RLS Policies for help_items
CREATE POLICY "Public can view help items" 
ON public.help_items 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage help items" 
ON public.help_items 
FOR ALL 
USING (is_current_user_admin());

-- Create indexes
CREATE INDEX idx_help_categories_order ON public.help_categories(order_index);
CREATE INDEX idx_help_items_category ON public.help_items(category_id);
CREATE INDEX idx_help_items_order ON public.help_items(category_id, order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_help_categories_updated_at
  BEFORE UPDATE ON public.help_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_help_items_updated_at
  BEFORE UPDATE ON public.help_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial categories
INSERT INTO public.help_categories (title, icon_name, order_index) VALUES
  ('Общие вопросы', 'HelpCircle', 1),
  ('Регистрация и аккаунт', 'User', 2),
  ('Покупки и заказы', 'ShoppingCart', 3),
  ('Продажи', 'Package', 4),
  ('Оплата и доставка', 'CreditCard', 5),
  ('Техническая поддержка', 'Settings', 6);