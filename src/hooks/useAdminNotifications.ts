import { supabase } from "@/integrations/supabase/client";

export const useAdminNotifications = () => {
  const notifyAdminsNewProduct = async (productId: string) => {
    try {
      console.log(`📢 [AdminNotification] Sending notification for new product: ${productId}`);
      
      const { error } = await supabase.functions.invoke('notify-admins-new-product', {
        body: { productId }
      });

      if (error) {
        console.error(`❌ [AdminNotification] Failed to notify admins:`, error);
        // Don't throw - this is a secondary operation
      } else {
        console.log(`✅ [AdminNotification] Successfully notified admins about product: ${productId}`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while notifying admins:`, error);
      // Don't throw - notification is secondary to the main action
    }
  };

  return {
    notifyAdminsNewProduct
  };
};