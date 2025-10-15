import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useBackgroundSync } from "./useBackgroundSync";
import { useLanguage } from "@/hooks/useLanguage";
import { getProductStatusTranslations } from "@/utils/translations/productStatuses";
import { useUpstashRepost } from "./useUpstashRepost";

const STUCK_TIMEOUT = 60000; // 60 seconds timeout for stuck reposts

export const useProductRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const [queuedReposts, setQueuedReposts] = useState<Record<string, string>>({}); // Track queued reposts by productId -> syncId
  const { user } = useAuth();
  
  // 🆕 UPSTASH QStash Integration (new reliable system with queue)
  const { sendRepostViaUpstash, isReposting: upstashReposting } = useUpstashRepost();
  
  // 🗑️ OLD SYSTEM (kept for rollback, currently not used)
  // const { queueForSync, getPendingCount } = useBackgroundSync();
  
  const { language } = useLanguage();
  const t = getProductStatusTranslations(language);

  // Clear stuck reposts after timeout
  useEffect(() => {
    const timeouts: Record<string, NodeJS.Timeout> = {};

    Object.entries(queuedReposts).forEach(([productId, syncId]) => {
      console.log(`⏰ [ProductRepost] Setting ${STUCK_TIMEOUT / 1000}s timeout for ${productId}`);
      
      timeouts[productId] = setTimeout(() => {
        console.warn(`⚠️ [ProductRepost] Clearing stuck repost for product ${productId} (syncId: ${syncId})`);
        setQueuedReposts(prev => {
          const updated = { ...prev };
          delete updated[productId];
          return updated;
        });
        
        toast.warning('Repost timeout - you can try again', {
          description: 'The repost request may have been processed or timed out'
        });
      }, STUCK_TIMEOUT);
    });

    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout));
    };
  }, [queuedReposts]);

  // Callback for sync completion
  const handleSyncCompletion = useCallback((syncId: string, productId: string, success: boolean, error?: any) => {
    console.log(`🔔 [ProductRepost] Sync completed for ${productId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    
    setQueuedReposts(prev => {
      const updated = { ...prev };
      if (updated[productId] === syncId) {
        delete updated[productId];
      }
      return updated;
    });

    if (success) {
      toast.success('Repost sent successfully!');
    } else {
      console.error(`❌ [ProductRepost] Repost failed for ${productId}:`, error);
      toast.error(t.repostMessages.queueError, {
        description: 'Please try again later'
      });
    }
  }, [t.repostMessages.queueError]);

  // Check if product can be reposted based on catalog position
  const checkCanRepost = (catalogPosition: string) => {
    // Admin can always repost
    if (user && user.user_metadata?.user_type === 'admin') {
      return {
        canRepost: true,
        hoursLeft: 0
      };
    }

    // Calculate time difference (72 hours = 3 days)
    const catalogTime = new Date(catalogPosition).getTime();
    const currentTime = new Date().getTime();
    const timeDifference = currentTime - catalogTime;
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

  // 🆕 NEW: Send repost via Upstash QStash (guaranteed delivery + deduplication + queue)
  const sendRepost = async (productId: string, newPrice?: number) => {
    if (!user) {
      toast.error(t.repostMessages.loginRequired);
      return false;
    }

    if (isReposting[productId] || upstashReposting[productId]) {
      return false;
    }

    setIsReposting(prev => ({ ...prev, [productId]: true }));

    try {
      console.log(`📢 [ProductRepost] Processing repost for product: ${productId}${newPrice ? ` with new price: ${newPrice}` : ''}`);
      
      let oldPrice: number | undefined;

      // If price is changed, update product price first
      if (newPrice !== undefined) {
        const { data: currentProduct } = await supabase
          .from('products')
          .select('price, catalog_position')
          .eq('id', productId)
          .single();

        oldPrice = currentProduct?.price;

        // Update catalog_position to current time to move product to top
        const newCatalogPosition = new Date().toISOString();
        console.log(`📍 Updating catalog_position for product ${productId} with price change to ${newCatalogPosition}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            price: newPrice,
            catalog_position: newCatalogPosition
          })
          .eq('id', productId);

        if (updateError) {
          console.error(`💥 [ProductRepost] Error updating product price:`, updateError);
          toast.error(t.repostMessages.queueError, {
            description: 'Failed to update product price'
          });
          return false;
        }
        
        console.log(`✅ [ProductRepost] Product price updated from ${oldPrice} to ${newPrice}`);
      } else {
        // Update catalog position for repost without price change
        const newCatalogPosition = new Date().toISOString();
        console.log(`📍 Updating catalog_position for product ${productId} without price change to ${newCatalogPosition}`);
        
        const { error: positionError } = await supabase
          .from('products')
          .update({ catalog_position: newCatalogPosition })
          .eq('id', productId);

        if (positionError) {
          console.error(`💥 [ProductRepost] Error updating catalog position:`, positionError);
          // Continue anyway as this is not critical
        }
      }

      // 🆕 Send via Upstash QStash (guaranteed delivery + queue)
      const success = await sendRepostViaUpstash({
        productId,
        priceChanged: !!newPrice,
        newPrice,
        oldPrice
      });

      if (!success && newPrice !== undefined && oldPrice !== undefined) {
        // Rollback price change if QStash failed
        console.warn(`⚠️ [ProductRepost] QStash failed, rolling back price`);
        const { data: currentProduct } = await supabase
          .from('products')
          .select('catalog_position')
          .eq('id', productId)
          .single();

        await supabase
          .from('products')
          .update({ 
            price: oldPrice,
            catalog_position: currentProduct?.catalog_position 
          })
          .eq('id', productId);
      }

      return success;

    } catch (error) {
      console.error(`💥 [ProductRepost] Exception during repost:`, error);
      toast.error(t.repostMessages.queueError, {
        description: t.repostMessages.queueErrorDescription
      });
      return false;
    } finally {
      setIsReposting(prev => ({ ...prev, [productId]: false }));
    }
  };

  /* 🗑️ OLD SYSTEM - Kept for rollback (comment out above and uncomment this)
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
        // Store old price and catalog_position for display purposes
        const { data: currentProduct } = await supabase
          .from('products')
          .select('price, catalog_position')
          .eq('id', productId)
          .single();

        const oldPrice = currentProduct?.price;

        // Update catalog_position to current time to move product to top
        const newCatalogPosition = new Date().toISOString();
        console.log(`📍 Updating catalog_position for product ${productId} with price change to ${newCatalogPosition}`);
        
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            price: newPrice,
            catalog_position: newCatalogPosition
          })
          .eq('id', productId);

        if (updateError) {
          console.error(`💥 [ProductRepost] Error updating product price:`, updateError);
          toast.error(t.repostMessages.queueError, {
            description: 'Failed to update product price'
          });
          return false;
        }
        
        console.log(`✅ [ProductRepost] Product price updated from ${oldPrice} to ${newPrice}`);
        
        try {
          // Generate requestId for idempotency
          const requestId = `repost-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Add to background sync queue with old price for display
          const syncId = await queueForSync('product-repost', { 
            productId, 
            priceChanged: true,
            newPrice, 
            oldPrice,
            requestId
          }, (syncId, success, error) => handleSyncCompletion(syncId, productId, success, error));
          
          // Track queued repost
          setQueuedReposts(prev => ({ ...prev, [productId]: syncId }));
          
          console.log(`✅ [ProductRepost] Repost queued successfully with ID: ${syncId}`);
          toast.success(t.repostMessages.queuedSuccess, {
            description: t.repostMessages.queuedSuccessDescription
          });
          return true;
        } catch (queueError) {
          console.error(`💥 [ProductRepost] Error queuing repost, rolling back price:`, queueError);
          
          // Rollback price change and catalog_position
          const { error: rollbackError } = await supabase
            .from('products')
            .update({ 
              price: oldPrice,
              catalog_position: currentProduct?.catalog_position 
            })
            .eq('id', productId);
            
          if (rollbackError) {
            console.error(`💥 [ProductRepost] Failed to rollback price:`, rollbackError);
          } else {
            console.log(`✅ [ProductRepost] Price rolled back to ${oldPrice}`);
          }
          
          toast.error(t.repostMessages.queueError, {
            description: t.repostMessages.queueErrorDescription
          });
          return false;
        }
      }
      
      // Update catalog position for repost without price change
      const newCatalogPosition = new Date().toISOString();
      console.log(`📍 Updating catalog_position for product ${productId} without price change to ${newCatalogPosition}`);
      
      const { error: positionError } = await supabase
        .from('products')
        .update({ catalog_position: newCatalogPosition })
        .eq('id', productId);

      if (positionError) {
        console.error(`💥 [ProductRepost] Error updating catalog position:`, positionError);
        // Continue anyway as this is not critical
      }

      // Generate requestId for idempotency
      const requestId = `repost-${productId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Add to background sync queue for reliable delivery (no price change case)
      const syncId = await queueForSync('product-repost', { 
        productId, 
        priceChanged: false,
        requestId
      }, (syncId, success, error) => handleSyncCompletion(syncId, productId, success, error));
      
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
  */

  return {
    checkCanRepost,
    sendRepost,
    isReposting: { ...isReposting, ...upstashReposting },
    queuedReposts,
    pendingCount: 0 // QStash handles queue internally
    // pendingCount: getPendingCount() // OLD: for rollback uncomment this
  };
};