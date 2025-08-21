
import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { deduplicateArray } from '@/utils/deduplication';

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
          setOrderImages(deduplicateArray(order.images || []));
          
          const { data: videosData, error: videosError } = await supabase
            .from('order_videos')
            .select('url')
            .eq('order_id', order.id);

          if (videosError) throw videosError;
          const videoUrls = videosData?.map(v => v.url) || [];
          
          // Для обратной совместимости добавляем видео из старого поля video_url
          const legacyVideoUrls = order.video_url || [];
          const combinedVideos = deduplicateArray([...videoUrls, ...legacyVideoUrls]);
          
          setOrderVideos(combinedVideos);

        } catch (error) {
          console.error("Не удалось загрузить медиафайлы заказа:", error);
          toast({ title: "Ошибка", description: "Не удалось загрузить медиафайлы заказа.", variant: "destructive" });
        }
      };
      loadMedia();
    }
  }, [order, open]);

  const handleImagesChange = useCallback((newUrls: string[]) => {
    setOrderImages(newUrls);
  }, []);
  
  const handleVideosChange = useCallback((newUrls: string[]) => {
    setOrderVideos(newUrls);
  }, []);
  
  const handleVideoDelete = useCallback(async (urlToDelete: string) => {
      if (!order?.id) return;
      
      const newVideoList = orderVideos.filter(url => url !== urlToDelete);
      setOrderVideos(newVideoList);
      
      // Мы не удаляем из базы данных немедленно.
      // Логика сохранения (onSubmit) полностью перезапишет видео,
      // так что удаление из локального состояния - это все, что нужно.
      toast({ title: 'Видео будет удалено при сохранении' });

  }, [order?.id, orderVideos]);

  return {
    orderImages,
    orderVideos,
    handleImagesChange,
    handleVideosChange,
    handleVideoDelete
  };
};
