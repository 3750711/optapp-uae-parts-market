import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseOrderPhotoCountReturn {
  currentCount: number;
  isLoading: boolean;
  refreshCount: () => Promise<void>;
  checkLimit: (additionalPhotos?: number) => { withinLimit: boolean; message?: string };
}

export const useOrderPhotoCount = (orderId?: string): UseOrderPhotoCountReturn => {
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshCount = useCallback(async () => {
    if (!orderId) {
      setCurrentCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('images')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('Error fetching order photo count:', error);
        setCurrentCount(0);
      } else {
        const count = Array.isArray(data?.images) ? data.images.length : 0;
        setCurrentCount(count);
      }
    } catch (error) {
      console.error('Error in refreshCount:', error);
      setCurrentCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  const checkLimit = useCallback((additionalPhotos: number = 1) => {
    const totalAfterUpload = currentCount + additionalPhotos;
    
    if (totalAfterUpload > 50) {
      return {
        withinLimit: false,
        message: `Превышен лимит фото. Максимум 50 фото на заказ. Текущее количество: ${currentCount}, попытка добавить: ${additionalPhotos}`
      };
    }
    
    return { withinLimit: true };
  }, [currentCount]);

  return {
    currentCount,
    isLoading,
    refreshCount,
    checkLimit
  };
};