import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTelegramNotification = () => {
  const sendProductNotification = async (productId: string, notificationType: string = 'status_change') => {
    try {
      console.log(`📢 [TelegramNotification] Sending ${notificationType} notification for product: ${productId}`);
      
      const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          productId,
          notificationType 
        }
      });

      if (notificationError) {
        console.error(`❌ [TelegramNotification] Telegram notification failed:`, notificationError);
        // Don't show error toast for notification failures - the main action succeeded
        console.warn(`⚠️ [TelegramNotification] Notification failed but product status was updated successfully`);
      } else {
        console.log(`✅ [TelegramNotification] Telegram notification sent successfully`);
      }
    } catch (error) {
      console.error(`💥 [TelegramNotification] Exception while sending notification:`, error);
      // Don't throw or show error - notification is secondary to the main action
    }
  };

  return {
    sendProductNotification
  };
};