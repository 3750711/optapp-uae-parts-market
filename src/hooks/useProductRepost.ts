import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export const useProductRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  // Check if user can repost a product
  const checkCanRepost = (lastNotificationSentAt?: string | null) => {
    // Admin can always repost
    if (user && user.user_metadata?.user_type === 'admin') {
      return {
        canRepost: true,
        hoursLeft: 0
      };
    }

    // If no previous notification, can repost
    if (!lastNotificationSentAt) {
      return {
        canRepost: true,
        hoursLeft: 0
      };
    }

    // Calculate time difference (72 hours = 3 days)
    const lastNotificationTime = new Date(lastNotificationSentAt).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - lastNotificationTime;
    const hoursDifference = timeDifference / (1000 * 60 * 60);
    
    const REPOST_COOLDOWN_HOURS = 72; // 3 days
    
    if (hoursDifference >= REPOST_COOLDOWN_HOURS) {
      return {
        canRepost: true,
        hoursLeft: 0
      };
    }

    return {
      canRepost: false,
      hoursLeft: Math.ceil(REPOST_COOLDOWN_HOURS - hoursDifference)
    };
  };

  // Send repost notification
  const sendRepost = async (productId: string) => {
    if (!user) {
      toast.error('Необходимо войти в систему');
      return false;
    }

    if (isReposting[productId]) {
      return false;
    }

    setIsReposting(prev => ({ ...prev, [productId]: true }));

    try {
      console.log(`📢 [ProductRepost] Sending repost notification for product: ${productId}`);
      
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: { 
          productId,
          notificationType: 'repost'
        }
      });

      if (error) {
        console.error(`❌ [ProductRepost] Repost failed:`, error);
        toast.error('Ошибка при отправке репоста');
        return false;
      }

      console.log(`✅ [ProductRepost] Repost sent successfully`);
      toast.success('Репост отправлен в Telegram!');
      return true;

    } catch (error) {
      console.error(`💥 [ProductRepost] Exception during repost:`, error);
      toast.error('Ошибка при отправке репоста');
      return false;
    } finally {
      setIsReposting(prev => ({ ...prev, [productId]: false }));
    }
  };

  return {
    checkCanRepost,
    sendRepost,
    isReposting
  };
};