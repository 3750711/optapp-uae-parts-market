
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UseOrderMediaProps {
  order: any;
  open: boolean;
}

export const useOrderMedia = ({ order, open }: UseOrderMediaProps) => {
  const queryClient = useQueryClient();
  const [orderImages, setOrderImages] = useState<string[]>([]);
  const [orderVideos, setOrderVideos] = useState<string[]>([]);

  useEffect(() => {
    if (order && open) {
      const loadMedia = async () => {
        try {
          console.log('🎬 Loading media for order:', order.id);
          
          // Загружаем изображения
          setOrderImages(order.images || []);
          
          // Загружаем видео из таблицы order_videos (приоритет)
          const { data: videosData, error: videosError } = await supabase
            .from('order_videos')
            .select('url')
            .eq('order_id', order.id);

          if (videosError) throw videosError;
          
          let videoUrls: string[] = [];
          
          if (videosData && videosData.length > 0) {
            // Есть видео в таблице order_videos - используем их
            videoUrls = videosData.map(v => v.url);
            console.log('✅ Using videos from order_videos table:', videoUrls.length);
          } else {
            // Нет видео в таблице order_videos - проверяем старое поле video_url
            const legacyVideoUrls = order.video_url || [];
            if (legacyVideoUrls.length > 0) {
              videoUrls = legacyVideoUrls;
              console.log('📦 Using legacy videos from video_url field:', videoUrls.length);
            }
          }
          
          setOrderVideos(videoUrls);
          console.log('🎬 Final video URLs loaded:', videoUrls);

        } catch (error) {
          console.error("❌ Не удалось загрузить медиафайлы заказа:", error);
          toast({ 
            title: "Ошибка", 
            description: "Не удалось загрузить медиафайлы заказа.", 
            variant: "destructive" 
          });
        }
      };
      loadMedia();
    }
  }, [order, open]);

  const handleImagesChange = useCallback((newUrls: string[]) => {
    console.log('📸 Images changed:', newUrls.length);
    setOrderImages(newUrls);
  }, []);
  
  const handleVideosChange = useCallback((newUrls: string[]) => {
    console.log('🎬 Videos changed:', newUrls.length);
    setOrderVideos(newUrls);
  }, []);
  
  const handleVideoDelete = useCallback(async (urlToDelete: string) => {
    if (!order?.id) return;
    
    console.log('🗑️ Deleting video:', urlToDelete);
    const newVideoList = orderVideos.filter(url => url !== urlToDelete);
    setOrderVideos(newVideoList);
    
    // Удаляем из таблицы order_videos
    try {
      const { error } = await supabase
        .from('order_videos')
        .delete()
        .eq('order_id', order.id)
        .eq('url', urlToDelete);
      
      if (error) {
        console.error('❌ Error deleting video from order_videos:', error);
        toast({ 
          title: 'Ошибка', 
          description: 'Не удалось удалить видео из базы данных',
          variant: 'destructive'
        });
        // Возвращаем видео обратно в случае ошибки
        setOrderVideos(orderVideos);
      } else {
        console.log('✅ Video deleted from order_videos table');
        toast({ title: 'Видео удалено' });
      }
    } catch (error) {
      console.error('❌ Error in handleVideoDelete:', error);
      setOrderVideos(orderVideos);
    }
  }, [order?.id, orderVideos]);

  return {
    orderImages,
    orderVideos,
    handleImagesChange,
    handleVideosChange,
    handleVideoDelete
  };
};
