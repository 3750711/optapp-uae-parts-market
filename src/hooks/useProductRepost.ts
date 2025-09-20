import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBackgroundSync } from "./useBackgroundSync";

export const useProductRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const [queuedReposts, setQueuedReposts] = useState<Record<string, string>>({}); // Track queued reposts by productId -> syncId
  const { user } = useAuth();
  const { queueForSync, getPendingCount } = useBackgroundSync();

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

  // Send repost notification via background queue
  const sendRepost = async (productId: string) => {
    if (!user) {
      toast.error('Необходимо войти в систему');
      return false;
    }

    if (isReposting[productId] || queuedReposts[productId]) {
      return false;
    }

    setIsReposting(prev => ({ ...prev, [productId]: true }));

    try {
      console.log(`📢 [ProductRepost] Queuing repost notification for product: ${productId}`);
      
      // Add to background sync queue for reliable delivery
      const syncId = await queueForSync('product-repost', { productId });
      
      // Track queued repost
      setQueuedReposts(prev => ({ ...prev, [productId]: syncId }));
      
      console.log(`✅ [ProductRepost] Repost queued successfully with ID: ${syncId}`);
      toast.success('Репост добавлен в очередь!', {
        description: 'Уведомление будет отправлено в ближайшее время'
      });
      return true;

    } catch (error) {
      console.error(`💥 [ProductRepost] Exception during repost queuing:`, error);
      toast.error('Ошибка при добавлении репоста в очередь', {
        description: 'Попробуйте еще раз через несколько минут'
      });
      return false;
    } finally {
      setIsReposting(prev => ({ ...prev, [productId]: false }));
    }
  };

  return {
    checkCanRepost,
    sendRepost,
    isReposting,
    queuedReposts,
    pendingCount: getPendingCount()
  };
};