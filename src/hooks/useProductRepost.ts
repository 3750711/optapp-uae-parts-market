import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBackgroundSync } from "./useBackgroundSync";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";

export const useProductRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const [queuedReposts, setQueuedReposts] = useState<Record<string, string>>({}); // Track queued reposts by productId -> syncId
  const { user } = useAuth();
  const { queueForSync, getPendingCount } = useBackgroundSync();
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

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

  // Send repost notification via background queue with optional price change
  const sendRepost = async (productId: string, newPrice?: number) => {
    if (!user) {
      toast.error(t.repostMessages.loginRequired);
      return false;
    }

    if (isReposting[productId] || queuedReposts[productId]) {
      return false;
    }

    setIsReposting(prev => ({ ...prev, [productId]: true }));

    try {
      console.log(`📢 [ProductRepost] Queuing repost notification for product: ${productId}${newPrice ? ` with new price: ${newPrice}` : ''}`);
      
      // If price is changed, update product price first
      if (newPrice !== undefined) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ price: newPrice })
          .eq('id', productId);

        if (updateError) {
          console.error(`💥 [ProductRepost] Error updating product price:`, updateError);
          toast.error(t.repostMessages.queueError, {
            description: 'Failed to update product price'
          });
          return false;
        }
        
        console.log(`✅ [ProductRepost] Product price updated to ${newPrice}`);
      }
      
      // Add to background sync queue for reliable delivery
      const syncId = await queueForSync('product-repost', { 
        productId, 
        priceChanged: newPrice !== undefined,
        newPrice 
      });
      
      // Track queued repost
      setQueuedReposts(prev => ({ ...prev, [productId]: syncId }));
      
      console.log(`✅ [ProductRepost] Repost queued successfully with ID: ${syncId}`);
      toast.success(t.repostMessages.queuedSuccess, {
        description: t.repostMessages.queuedSuccessDescription
      });
      return true;

    } catch (error) {
      console.error(`💥 [ProductRepost] Exception during repost queuing:`, error);
      toast.error(t.repostMessages.queueError, {
        description: t.repostMessages.queueErrorDescription
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