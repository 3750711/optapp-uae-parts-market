import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface RepostData {
  productId: string;
  priceChanged: boolean;
  newPrice?: number;
  oldPrice?: number;
}

export const useUpstashRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const sendRepostViaUpstash = useCallback(async (data: RepostData) => {
    if (!user) {
      toast.error('Please login to repost');
      return false;
    }

    setIsReposting(prev => ({ ...prev, [data.productId]: true }));

    try {
      // Генерируем уникальный idempotency key для дедупликации
      const idempotencyKey = `repost-${data.productId}-${Date.now()}`;
      
      console.log('📮 [QStash] Sending repost to queue:', idempotencyKey);

      // Вызываем Edge Function который отправит в QStash
      const { data: result, error } = await supabase.functions.invoke('trigger-upstash-repost', {
        body: {
          productId: data.productId,
          priceChanged: data.priceChanged,
          newPrice: data.newPrice,
          oldPrice: data.oldPrice,
          idempotencyKey,
          userId: user.id
        }
      });

      if (error) {
        console.error('❌ [QStash] Failed to queue repost:', error);
        toast.error('Failed to queue repost');
        return false;
      }

      console.log('✅ [QStash] Repost queued successfully:', result);
      toast.success('Repost queued successfully!', {
        description: 'Your product will be reposted shortly'
      });

      return true;
    } catch (error) {
      console.error('💥 [QStash] Exception:', error);
      toast.error('Failed to queue repost');
      return false;
    } finally {
      setIsReposting(prev => ({ ...prev, [data.productId]: false }));
    }
  }, [user]);

  return {
    sendRepostViaUpstash,
    isReposting
  };
};
