
-- Обновляем RLS политики для price_offers
-- Удаляем ограничение на максимальную цену при создании предложений
DROP POLICY IF EXISTS "Buyers can create offers" ON public.price_offers;

-- Создаем новую политику для создания предложений без ограничения максимальной цены
CREATE POLICY "Buyers can create offers" 
ON public.price_offers 
FOR INSERT 
WITH CHECK (
  buyer_id = auth.uid() 
  AND offered_price > 0 
  AND EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id 
    AND status = 'active'
  )
);

-- Обновляем политику для обновления предложений
DROP POLICY IF EXISTS "Buyers can update their own pending offers" ON public.price_offers;

-- Создаем новую политику для обновления предложений
CREATE POLICY "Buyers can update their own pending offers" 
ON public.price_offers 
FOR UPDATE 
USING (buyer_id = auth.uid() AND status = 'pending')
WITH CHECK (
  buyer_id = auth.uid() 
  AND status = 'pending'
  AND offered_price > 0
);
