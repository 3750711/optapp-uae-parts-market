import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTelegramNotification = () => {
  const sendProductNotification = async (productId: string, notificationType: string = 'status_change') => {
    try {
      console.log(`📢 [TelegramNotification] Queueing ${notificationType} notification for product: ${productId}`);
      
      const { error: notificationError } = await supabase.functions.invoke('trigger-upstash-notification', {
        body: { 
          notificationType: 'product',
          payload: {
            productId,
            notificationType 
          }
        }
      });

      if (notificationError) {
        console.error(`❌ [TelegramNotification] Failed to queue notification:`, notificationError);
        console.warn(`⚠️ [TelegramNotification] Notification failed but product status was updated successfully`);
      } else {
        console.log(`✅ [TelegramNotification] Notification queued successfully via QStash`);
      }
    } catch (error) {
      console.error(`💥 [TelegramNotification] Exception while queueing notification:`, error);
    }
  };

  return {
    sendProductNotification
  };
};