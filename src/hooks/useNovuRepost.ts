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

export const useNovuRepost = () => {
  const [isReposting, setIsReposting] = useState<Record<string, boolean>>({});
  const { user } = useAuth();

  const sendRepostViaNovu = useCallback(async (data: RepostData) => {
    if (!user) {
      toast.error('Please login to repost');
      return false;
    }

    setIsReposting(prev => ({ ...prev, [data.productId]: true }));

    try {
      // Генерируем уникальный transactionId для дедупликации
      const transactionId = `repost-${data.productId}-${Date.now()}`;
      
      console.log('🔔 [Novu] Triggering repost workflow:', transactionId);

      // Вызываем Edge Function который будет триггерить Novu
      const { data: result, error } = await supabase.functions.invoke('trigger-novu-repost', {
        body: {
          productId: data.productId,
          priceChanged: data.priceChanged,
          newPrice: data.newPrice,
          oldPrice: data.oldPrice,
          transactionId,
          userId: user.id
        }
      });

      if (error) {
        console.error('❌ [Novu] Failed to trigger workflow:', error);
        toast.error('Failed to queue repost');
        return false;
      }

      console.log('✅ [Novu] Workflow triggered successfully:', result);
      toast.success('Repost queued successfully!', {
        description: 'Your product will be reposted shortly'
      });

      return true;
    } catch (error) {
      console.error('💥 [Novu] Exception:', error);
      toast.error('Failed to queue repost');
      return false;
    } finally {
      setIsReposting(prev => ({ ...prev, [data.productId]: false }));
    }
  }, [user]);

  return {
    sendRepostViaNovu,
    isReposting
  };
};
