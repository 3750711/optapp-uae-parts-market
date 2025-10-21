import { supabase } from "@/integrations/supabase/client";

export const useAdminNotifications = () => {
  const notifyAdminsNewProduct = async (productId: string) => {
    try {
      console.log(`📢 [AdminNotification] Sending notification for new product: ${productId}`);
      
      // Call notify-admins-new-product directly (it now routes via QStash)
      const { error } = await supabase.functions.invoke('notify-admins-new-product', {
        body: { productId }
      });

      if (error) {
        console.error(`❌ [AdminNotification] Failed to send admin notification:`, error);
      } else {
        console.log(`✅ [AdminNotification] Admin notification sent successfully (via QStash queue)`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while sending admin notification:`, error);
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
      
      // Call notify-admins-new-user directly (it now routes via QStash)
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
        console.error(`❌ [AdminNotification] Failed to send new user notification:`, error);
      } else {
        console.log(`✅ [AdminNotification] New user notification sent successfully (via QStash queue)`);
      }
    } catch (error) {
      console.error(`💥 [AdminNotification] Exception while sending new user notification:`, error);
    }
  };

  return {
    notifyAdminsNewProduct,
    notifyAdminsNewUser,
  };
};