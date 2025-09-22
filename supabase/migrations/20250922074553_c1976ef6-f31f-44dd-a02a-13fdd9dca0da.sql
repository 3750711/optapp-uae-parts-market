-- Включаем RLS для таблицы store_public_access_logs
ALTER TABLE public.store_public_access_logs ENABLE ROW LEVEL SECURITY;

-- Создаем политику для логов доступа к публичным магазинам
CREATE POLICY "System can manage store access logs" ON public.store_public_access_logs
FOR ALL USING (true);