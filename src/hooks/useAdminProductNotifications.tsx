
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';

export const useAdminProductNotifications = () => {
  const { toast } = useToast();
  const [isNotificationSending, setIsNotificationSending] = useState<Record<string, boolean>>({});

  const sendNotification = async (product: Product) => {
    try {
      setIsNotificationSending(prev => ({...prev, [product.id]: true}));
      
      // Получаем свежие данные о товаре со всеми изображениями
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', product.id)
        .single();

      if (fetchError || !freshProduct) {
        throw new Error(fetchError?.message || 'Failed to fetch product details');
      }
      
      console.log("Вызов edge-функции send-telegram-notification для товара", product.id);
      
      // Вызываем edge функцию для отправки уведомления
      const { data, error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { product: freshProduct }
      });
      
      if (error) {
        console.error('Error calling function:', error);
        throw new Error(error.message);
      }
      
      console.log("Результат вызова edge-функции:", data);
      
      if (data && data.success) {
        toast({
          title: "Успех",
          description: "Уведомление отправлено в Telegram",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Внимание",
          description: (data && data.message) || "Уведомление не было отправлено"
        });
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отправить уведомление: " + (error instanceof Error ? error.message : String(error))
      });
    } finally {
      setIsNotificationSending(prev => ({...prev, [product.id]: false}));
    }
  };

  // Добавляем механизм повторных попыток для отправки уведомлений
  const sendNotificationWithRetry = async (product: Product, maxRetries = 3) => {
    let retries = 0;
    
    const attemptSend = async (): Promise<boolean> => {
      try {
        await sendNotification(product);
        return true;
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Попытка ${retries} из ${maxRetries} для отправки уведомления`);
          
          // Экспоненциальная задержка между попытками
          const delay = 1000 * Math.pow(2, retries);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return await attemptSend();
        } else {
          console.error('Превышено максимальное количество попыток отправки уведомления');
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: `Превышено количество попыток отправки уведомления (${maxRetries})`
          });
          return false;
        }
      }
    };
    
    return attemptSend();
  };

  return {
    sendNotification,
    sendNotificationWithRetry,
    isNotificationSending
  };
};
