
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OrderFormData } from '@/types/order';

interface OptimizedOrderSubmissionResult {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
  handleSubmit: (formData: OrderFormData, images: string[], videos: string[]) => Promise<void>;
  handleOrderUpdate: (order: any) => void;
  resetCreatedOrder: () => void;
  retryLastOperation: (() => void) | null;
  clearError: () => void;
}

export const useOptimizedOrderSubmission = (): OptimizedOrderSubmissionResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [progress, setProgress] = useState(0);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryLastOperation, setRetryLastOperation] = useState<(() => void) | null>(null);

  const clearError = useCallback(() => {
    setError(null);
    setRetryLastOperation(null);
  }, []);

  const resetCreatedOrder = useCallback(() => {
    setCreatedOrder(null);
    clearError();
  }, [clearError]);

  const handleOrderUpdate = useCallback((order: any) => {
    setCreatedOrder(order);
  }, []);

  const handleSubmit = useCallback(async (
    formData: OrderFormData, 
    images: string[], 
    videos: string[]
  ) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    
    try {
      // Stage 1: Prepare order data
      setStage('Подготовка данных заказа...');
      setProgress(20);
      
      const orderData = {
        title: formData.title,
        price: parseFloat(formData.price),
        brand: formData.brand,
        model: formData.model,
        seller_id: formData.sellerId,
        buyer_opt_id: formData.buyerOptId,
        delivery_method: formData.deliveryMethod,
        place_number: parseInt(formData.place_number) || 1,
        text_order: formData.text_order || null,
        delivery_price_confirm: formData.delivery_price ? parseFloat(formData.delivery_price) : null,
        description: formData.description || null,
        images: images,
        video_url: videos
      };

      console.log('🚀 Creating order with optimized data:', orderData);

      // Stage 2: Create order with all data in one call
      setStage('Создание заказа...');
      setProgress(60);

      const { data: order, error: orderError } = await supabase
        .rpc('create_complete_order', {
          order_data: orderData
        });

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw new Error(orderError.message || 'Ошибка при создании заказа');
      }

      if (!order) {
        throw new Error('Заказ не был создан');
      }

      console.log('✅ Order created successfully:', order);

      // Stage 3: Background Telegram notification (non-blocking)
      setStage('Финализация...');
      setProgress(90);

      // Start Telegram notification in background without waiting
      if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
        EdgeRuntime.waitUntil(
          supabase.functions.invoke('send-telegram-notification', {
            body: {
              order: {
                ...order,
                images: images,
                video_url: videos
              },
              action: 'create'
            }
          }).catch(error => {
            console.warn('📱 Telegram notification failed (non-critical):', error);
          })
        );
      } else {
        // Fallback for non-edge environments - fire and forget
        supabase.functions.invoke('send-telegram-notification', {
          body: {
            order: {
              ...order,
              images: images,
              video_url: videos
            },
            action: 'create'
          }
        }).catch(error => {
          console.warn('📱 Telegram notification failed (non-critical):', error);
        });
      }

      setProgress(100);
      setStage('Заказ создан успешно!');
      setCreatedOrder(order);

      toast({
        title: "Заказ создан!",
        description: `Заказ №${order.order_number} успешно создан`,
      });

    } catch (error: any) {
      console.error('💥 Order submission error:', error);
      const errorMessage = error.message || 'Произошла ошибка при создании заказа';
      setError(errorMessage);
      
      // Set retry function
      setRetryLastOperation(() => () => {
        handleSubmit(formData, images, videos);
      });
      
      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setStage('');
    }
  }, []);

  return {
    isLoading,
    stage,
    progress,
    createdOrder,
    error,
    handleSubmit,
    handleOrderUpdate,
    resetCreatedOrder,
    retryLastOperation,
    clearError
  };
};
