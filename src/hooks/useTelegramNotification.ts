import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTelegramNotification = () => {
  const sendProductNotification = async (productId: string, notificationType: string = 'status_change') => {
    try {
      console.log(`📢 [TelegramNotification] Sending ${notificationType} notification for product: ${productId}`);
      
      // Call send-telegram-notification directly (it now routes via QStash)
      const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          productId,
          notificationType 
        }
      });

      if (notificationError) {
        console.error(`❌ [TelegramNotification] Failed to send notification:`, notificationError);
        console.warn(`⚠️ [TelegramNotification] Notification failed but product status was updated successfully`);
      } else {
        console.log(`✅ [TelegramNotification] Notification sent successfully (via QStash queue)`);
      }
    } catch (error) {
      console.error(`💥 [TelegramNotification] Exception while sending notification:`, error);
    }
  };

  return {
    sendProductNotification
  };
};