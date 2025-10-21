import { supabase } from "@/integrations/supabase/client";

export const useAdminNotifications = () => {
  const notifyAdminsNewProduct = async (productId: string) => {
    try {
      console.log(`📢 [AdminNotification] Queueing notification for new product: ${productId}`);
      
      const { error } = await supabase.functions.invoke('trigger-upstash-notification', {
        body: { 
          notificationType: 'admin_new_product',
          payload: { productId }
        }
      });

      if (error) {
        console.error(`❌ [AdminNotification] Failed to queue admin notification:`, error);
      } else {
        console.log(`✅ [AdminNotification] Admin notification queued successfully via QStash`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while queueing admin notification:`, error);
    }
  };

  const notifyAdminsNewUser = async (params: {
    userId: string;
    fullName?: string | null;
    email: string;
    userType: 'buyer' | 'seller';
    phone?: string | null;
    optId?: string | null;
    telegram?: string | null;
    createdAt?: string;
  }) => {
    try {
      console.log(`📢 [AdminNotification] Queueing new user notification: ${params.email} (${params.userType})`);
      const { error } = await supabase.functions.invoke('trigger-upstash-notification', {
        body: {
          notificationType: 'admin_new_user',
          payload: {
            userId: params.userId,
            fullName: params.fullName || 'User',
            email: params.email,
            userType: params.userType,
            phone: params.phone || undefined,
            optId: params.optId || undefined,
            telegram: params.telegram || undefined,
            createdAt: params.createdAt || new Date().toISOString(),
          }
        }
      });

      if (error) {
        console.error(`❌ [AdminNotification] Failed to queue new user notification:`, error);
      } else {
        console.log(`✅ [AdminNotification] New user notification queued successfully via QStash`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while queueing new user notification:`, error);
    }
  };

  return {
    notifyAdminsNewProduct,
    notifyAdminsNewUser,
  };
};