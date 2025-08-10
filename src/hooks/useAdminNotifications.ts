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
      console.log(`📢 [AdminNotification] Sending new user notification: ${params.email} (${params.userType})`);
      const { error } = await supabase.functions.invoke('notify-admins-new-user', {
        body: {
          userId: params.userId,
          fullName: params.fullName || 'User',
          email: params.email,
          userType: params.userType,
          phone: params.phone || undefined,
          optId: params.optId || undefined,
          telegram: params.telegram || undefined,
          createdAt: params.createdAt || new Date().toISOString(),
        }
      });

      if (error) {
        console.error(`❌ [AdminNotification] Failed to notify admins about new user:`, error);
      } else {
        console.log(`✅ [AdminNotification] Admins notified about new user: ${params.email}`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while notifying admins about new user:`, error);
    }
  };

  return {
    notifyAdminsNewProduct,
    notifyAdminsNewUser,
  };
};