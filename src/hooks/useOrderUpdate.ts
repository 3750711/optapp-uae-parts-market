
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
    console.log('🔵 [START] updateOrderMedia called');
    console.log('🔵 [PARAMS] orderId:', orderId);
    console.log('🔵 [PARAMS] images:', images);
    console.log('🔵 [PARAMS] videos:', videos);
    console.log('🔵 [PARAMS] images type:', typeof images, Array.isArray(images));
    console.log('🔵 [PARAMS] videos type:', typeof videos, Array.isArray(videos));

    if (!orderId) {
      console.error('🔴 [ERROR] Order ID is required');
      return false;
    }

    setIsUpdating(true);
    try {
      const params = {
        p_order_id: orderId,
        p_images: images ?? null,
        p_video_url: videos ?? null
      };
      
      console.log('🔵 [RPC CALL] Calling update_order_media with params:', params);
      console.log('🔵 [RPC CALL] p_images is:', params.p_images);
      console.log('🔵 [RPC CALL] p_images === null?', params.p_images === null);
      console.log('🔵 [RPC CALL] p_images === []?', Array.isArray(params.p_images) && params.p_images.length === 0);

      const { data, error } = await supabase.rpc('update_order_media', params);

      console.log('🔵 [RPC RESPONSE] Received data:', data);
      console.log('🔵 [RPC RESPONSE] Received error:', error);

      if (error) {
        console.error('🔴 [ERROR] RPC Error details:');
        console.error('🔴 [ERROR] - Code:', error.code);
        console.error('🔴 [ERROR] - Message:', error.message);
        console.error('🔴 [ERROR] - Details:', error.details);
        console.error('🔴 [ERROR] - Hint:', error.hint);
        console.error('🔴 [ERROR] - Full error object:', JSON.stringify(error, null, 2));
        
        toast({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить медиафайлы в заказе",
          variant: "destructive",
        });
        return false;
      }

      console.log('🟢 [SUCCESS] Order media updated successfully');
      console.log('🟢 [SUCCESS] RPC returned data:', data);
      onSuccess?.();
      return true;
    } catch (error) {
      console.error('🔴 [EXCEPTION] Caught exception in updateOrderMedia:');
      console.error('🔴 [EXCEPTION] Error:', error);
      console.error('🔴 [EXCEPTION] Error type:', typeof error);
      console.error('🔴 [EXCEPTION] Error stringified:', JSON.stringify(error, null, 2));
      
      toast({
        title: "Ошибка сохранения",
        description: "Произошла ошибка при сохранении медиафайлов",
        variant: "destructive",
      });
      return false;
    } finally {
      console.log('🔵 [FINALLY] Setting isUpdating to false');
      setIsUpdating(false);
    }
  };

  return {
    updateOrderMedia,
    isUpdating
  };
};
