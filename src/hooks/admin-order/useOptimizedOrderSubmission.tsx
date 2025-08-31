
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OrderFormData } from '@/types/order';
import { deduplicateArray } from '@/utils/deduplication';

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
      // Stage 1: Подготовка данных заказа
      setStage('Подготовка данных заказа...');
      setProgress(20);

      // Получаем buyer_id по buyer_opt_id
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('opt_id', formData.buyerOptId)
        .single();

      if (buyerError || !buyerProfile) {
        throw new Error('Покупатель с указанным OPT_ID не найден');
      }

      console.log('✅ Buyer found:', buyerProfile);

      // Stage 2: Создание заказа через admin_create_order
      setStage('Создание заказа...');
      setProgress(60);

      const { data: orderId, error: orderError } = await supabase
        .rpc('admin_create_order', {
          p_title: formData.title,
          p_price: parseFloat(formData.price),
          p_place_number: parseInt(formData.place_number) || 1,
          p_seller_id: formData.sellerId,
          p_order_seller_name: null, // Будет установлено автоматически триггером
          p_seller_opt_id: null, // Будет установлено автоматически триггером
          p_buyer_id: buyerProfile.id,
          p_brand: formData.brand || '',
          p_model: formData.model || '',
          p_status: formData.status || 'created',
          p_order_created_type: 'free_order',
          p_telegram_url_order: null,
          p_images: deduplicateArray(images),
          p_videos: deduplicateArray(videos),
          p_product_id: null,
          p_delivery_method: formData.deliveryMethod,
          p_text_order: formData.text_order || null,
          p_delivery_price_confirm: formData.delivery_price ? parseFloat(formData.delivery_price) : null
        });

      if (orderError) {
        console.error('❌ Order creation error:', orderError);
        throw new Error(orderError.message || 'Ошибка при создании заказа');
      }

      if (!orderId) {
        throw new Error('Заказ не был создан');
      }

      console.log('✅ Order created with ID:', orderId);

      // Получаем полные данные созданного заказа
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError || !order) {
        console.error('❌ Failed to fetch created order:', fetchError);
        throw new Error('Заказ создан, но не удалось получить его данные');
      }

      console.log('✅ Order fetched successfully:', order);

      // Stage 3: Финализация (триггер автоматически отправит уведомление)
      setStage('Финализация...');
      setProgress(90);

      console.log('📱 Telegram notification will be sent automatically by database trigger');

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
