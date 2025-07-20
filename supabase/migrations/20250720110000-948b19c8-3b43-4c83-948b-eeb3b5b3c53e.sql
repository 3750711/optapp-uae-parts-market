
-- Удаляем политику, которая позволяет покупателям отменять свои предложения
DROP POLICY IF EXISTS "Buyers can cancel their own pending offers" ON public.price_offers;

-- Убираем возможность покупателям обновлять статус предложений
-- Оставляем только возможность продавцам и администраторам управлять статусом
DROP POLICY IF EXISTS "Buyers can update their own offers" ON public.price_offers;
