
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseOrderUpdateProps {
  orderId: string;
  onSuccess?: () => void;
}

export const useOrderUpdate = ({ orderId, onSuccess }: UseOrderUpdateProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateOrderMedia = async (images?: string[], videos?: string[]) => {
    if (!orderId) {
      console.error('Order ID is required');
      return false;
    }

    setIsUpdating(true);
    try {
      console.log('🔄 Updating order media:', orderId, { images: images?.length, videos: videos?.length });

      const { data, error } = await supabase.rpc('update_order_media', {
        p_order_id: orderId,
        p_images: images || null,
        p_video_url: videos || null
      });

      if (error) {
        console.error('❌ Error updating order media:', error);
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить медиафайлы в заказе",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Order media updated successfully');
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('❌ Error in updateOrderMedia:', error);
      toast({
        title: "Ошибка сохранения",
        description: "Произошла ошибка при сохранении медиафайлов",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateOrderMedia,
    isUpdating
  };
};
