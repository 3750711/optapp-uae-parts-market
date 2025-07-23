
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
      console.log('🔄 Updating order media:', orderId, { 
        images: images?.length, 
        videos: videos?.length 
      });

      // Обновляем изображения через функцию update_order_media
      if (images) {
        const { error: imagesError } = await supabase.rpc('update_order_media', {
          p_order_id: orderId,
          p_images: images,
          p_video_url: null // Не трогаем video_url
        });

        if (imagesError) {
          console.error('❌ Error updating order images:', imagesError);
          toast({
            title: "Ошибка сохранения",
            description: "Не удалось сохранить изображения в заказе",
            variant: "destructive",
          });
          return false;
        }
      }

      // Обновляем видео через таблицу order_videos
      if (videos) {
        // Сначала удаляем все существующие видео
        const { error: deleteError } = await supabase
          .from('order_videos')
          .delete()
          .eq('order_id', orderId);

        if (deleteError) {
          console.error('❌ Error deleting existing videos:', deleteError);
          toast({
            title: "Ошибка сохранения",
            description: "Не удалось обновить видео в заказе",
            variant: "destructive",
          });
          return false;
        }

        // Затем добавляем новые видео
        if (videos.length > 0) {
          const videosToInsert = videos.map(url => ({
            order_id: orderId,
            url: url
          }));

          const { error: insertError } = await supabase
            .from('order_videos')
            .insert(videosToInsert);

          if (insertError) {
            console.error('❌ Error inserting new videos:', insertError);
            toast({
              title: "Ошибка сохранения",
              description: "Не удалось сохранить видео в заказе",
              variant: "destructive",
            });
            return false;
          }
        }
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
