
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';

export const useAdminProductNotifications = () => {
  const { toast } = useToast();
  const [isNotificationSending, setIsNotificationSending] = useState<Record<string, boolean>>({});

  const shouldSendNotification = (product: Product): boolean => {
    // Check if notification was recently sent (within 5 minutes)
    if (product.last_notification_sent_at) {
      const lastSent = new Date(product.last_notification_sent_at);
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
      
      if (lastSent > fiveMinutesAgo) {
        toast({
          title: "Внимание",
          description: "Уведомление для этого товара уже было отправлено недавно",
          variant: "destructive", // Changed from "warning" to "destructive"
        });
        return false;
      }
    }
    return true;
  };

  const updateNotificationTimestamp = async (productId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('products')
      .update({ 
        last_notification_sent_at: new Date().toISOString() 
      })
      .eq('id', productId);
    
    if (error) {
      console.error('Error updating notification timestamp:', error);
      return false;
    }
    return true;
  };

  const sendNotification = async (product: Product) => {
    try {
      // Check if notification was sent recently
      if (!shouldSendNotification(product)) {
        return false;
      }
      
      console.log(`Starting notification process for product ID: ${product.id}`);
      setIsNotificationSending(prev => ({...prev, [product.id]: true}));
      
      // Update the notification timestamp
      await updateNotificationTimestamp(product.id);
      
      // Get fresh product data with all images
      const { data: freshProduct, error: fetchError } = await supabase
        .from('products')
        .select(`*, product_images(*)`)
        .eq('id', product.id)
        .single();

      if (fetchError || !freshProduct) {
        throw new Error(fetchError?.message || 'Failed to fetch product details');
      }
      
      console.log("Вызов edge-функции send-telegram-notification для товара", product.id);
      
      // Call the edge function to send notification
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
        return true;
      } else {
        toast({
          variant: "destructive",
          title: "Внимание",
          description: (data && data.message) || "Уведомление не было отправлено"
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отправить уведомление: " + (error instanceof Error ? error.message : String(error))
      });
      return false;
    } finally {
      setIsNotificationSending(prev => ({...prev, [product.id]: false}));
    }
  };

  // Retry logic for sending notifications
  const sendNotificationWithRetry = async (product: Product, maxRetries = 3) => {
    let retries = 0;
    
    const attemptSend = async (): Promise<boolean> => {
      try {
        return await sendNotification(product);
      } catch (error) {
        if (retries < maxRetries) {
          retries++;
          console.log(`Попытка ${retries} из ${maxRetries} для отправки уведомления`);
          
          // Exponential backoff
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

  // Bulk notifications handling with timestamp and rate limiting
  const sendBulkNotifications = async (products: Product[]) => {
    if (!products || products.length === 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не выбраны товары для отправки уведомлений"
      });
      return;
    }

    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const product of products) {
      try {
        // Check if notification should be sent
        if (!shouldSendNotification(product)) {
          skipped++;
          continue;
        }
        
        setIsNotificationSending(prev => ({...prev, [product.id]: true}));
        const result = await sendNotification(product);
        
        if (result) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Ошибка при отправке уведомления для товара ${product.id}:`, error);
        failed++;
      } finally {
        setIsNotificationSending(prev => ({...prev, [product.id]: false}));
      }
    }

    // Show result summary
    if (skipped > 0) {
      toast({
        title: "Информация",
        description: `Пропущено ${skipped} уведомлений (недавно отправлены)`,
      });
    }
    
    if (successful > 0 && failed === 0) {
      toast({
        title: "Успех",
        description: `Успешно отправлено ${successful} уведомлений`,
      });
    } else if (successful > 0 && failed > 0) {
      toast({
        variant: "destructive",
        title: "Частичный успех",
        description: `Отправлено ${successful} уведомлений, не удалось отправить ${failed}`,
      });
    } else if (successful === 0 && failed > 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: `Не удалось отправить уведомления (${failed})`,
      });
    }
  };

  return {
    sendNotification,
    sendNotificationWithRetry,
    sendBulkNotifications,
    isNotificationSending,
    shouldSendNotification,
    updateNotificationTimestamp
  };
};
