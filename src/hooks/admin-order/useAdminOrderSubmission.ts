
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
  retryCount: number;
  lastOperation: (() => Promise<void>) | null;
}

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

export const useAdminOrderSubmission = () => {
  const [state, setState] = useState<SubmissionState>({
    isLoading: false,
    stage: '',
    progress: 0,
    createdOrder: null,
    error: null,
    retryCount: 0,
    lastOperation: null
  });

  const updateState = useCallback((updates: Partial<SubmissionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setStage = useCallback((stage: string, progress: number) => {
    updateState({ stage, progress });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null, retryCount: 0 });
  }, [updateState]);

  const handleError = useCallback((error: any, operation?: () => Promise<void>) => {
    const errorMessage = error.message || 'Произошла неизвестная ошибка';
    console.error('Order submission error:', error);
    
    updateState({ 
      error: errorMessage,
      isLoading: false,
      lastOperation: operation || null
    });

    toast({
      title: "Ошибка создания заказа",
      description: errorMessage,
      variant: "destructive",
    });
  }, [updateState]);

  const retryOperation = useCallback(async () => {
    if (!state.lastOperation || state.retryCount >= MAX_RETRY_ATTEMPTS) {
      toast({
        title: "Превышено количество попыток",
        description: "Пожалуйста, попробуйте позже",
        variant: "destructive",
      });
      return;
    }

    try {
      updateState({ 
        error: null, 
        isLoading: true,
        retryCount: state.retryCount + 1
      });

      // Add delay before retry
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      await state.lastOperation();
    } catch (error) {
      handleError(error, state.lastOperation);
    }
  }, [state.lastOperation, state.retryCount, updateState, handleError]);

  const validateFormData = useCallback((formData: any) => {
    const errors: string[] = [];

    if (!formData.title?.trim()) {
      errors.push('Название товара обязательно');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Цена должна быть больше 0');
    }

    if (!formData.sellerId) {
      errors.push('Выберите продавца');
    }

    if (!formData.buyerOptId) {
      errors.push('Выберите покупателя');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
  }, []);

  const fetchBuyerByOptId = useCallback(async (optId: string) => {
    setStage('fetching_buyer', 20);
    
    const { data: buyer, error } = await supabase
      .from('profiles')
      .select('id, full_name, opt_id, telegram')
      .eq('opt_id', optId)
      .eq('user_type', 'buyer')
      .maybeSingle();

    if (error) {
      throw new Error(`Ошибка поиска покупателя: ${error.message}`);
    }

    if (!buyer) {
      throw new Error(`Покупатель с OPT_ID "${optId}" не найден`);
    }

    return buyer;
  }, [setStage]);

  const createOrder = useCallback(async (orderData: any) => {
    setStage('creating_order', 40);

    const { data: order, error } = await supabase
      .rpc('admin_create_order', {
        p_title: orderData.title,
        p_price: parseFloat(orderData.price),
        p_place_number: parseInt(orderData.place_number) || 1,
        p_seller_id: orderData.seller_id,
        p_order_seller_name: orderData.order_seller_name,
        p_seller_opt_id: orderData.seller_opt_id,
        p_buyer_id: orderData.buyer_id,
        p_brand: orderData.brand || null,
        p_model: orderData.model || null,
        p_status: 'created',
        p_order_created_type: 'free_order',
        p_telegram_url_order: orderData.telegram_url_order || null,
        p_images: orderData.images || [],
        p_product_id: null,
        p_delivery_method: orderData.delivery_method || 'cargo_rf',
        p_text_order: orderData.text_order || null,
        p_delivery_price_confirm: orderData.delivery_price ? parseFloat(orderData.delivery_price) : null
      });

    if (error) {
      throw new Error(`Ошибка создания заказа: ${error.message}`);
    }

    return order;
  }, [setStage]);

  const fetchCreatedOrder = useCallback(async (orderId: string) => {
    setStage('fetching_order', 60);

    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey(full_name, opt_id, telegram)
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      throw new Error(`Ошибка получения заказа: ${error.message}`);
    }

    return order;
  }, [setStage]);

  const saveVideoUrls = useCallback(async (orderId: string, videoUrls: string[]) => {
    if (!videoUrls.length) return;

    setStage('saving_videos', 80);

    const { error } = await supabase
      .from('orders')
      .update({ video_url: videoUrls })
      .eq('id', orderId);

    if (error) {
      throw new Error(`Ошибка сохранения видео: ${error.message}`);
    }
  }, [setStage]);

  const handleSubmit = useCallback(async (
    formData: any,
    images: string[],
    videos: string[]
  ) => {
    const submitOperation = async () => {
      try {
        updateState({ 
          isLoading: true, 
          error: null, 
          stage: 'validating', 
          progress: 0,
          retryCount: 0
        });

        // Step 1: Validate form data
        validateFormData(formData);

        // Step 2: Fetch buyer by OPT_ID
        const buyer = await fetchBuyerByOptId(formData.buyerOptId);

        // Step 3: Prepare order data
        const orderData = {
          title: formData.title.trim(),
          price: formData.price,
          place_number: formData.place_number || '1',
          seller_id: formData.sellerId,
          order_seller_name: '', // Will be set by trigger
          seller_opt_id: '', // Will be set by trigger
          buyer_id: buyer.id,
          brand: formData.brand || null,
          model: formData.model || null,
          delivery_method: formData.deliveryMethod || 'cargo_rf',
          text_order: formData.text_order || null,
          delivery_price: formData.delivery_price || null,
          telegram_url_order: buyer.telegram || null,
          images: images || []
        };

        // Step 4: Create order
        const orderId = await createOrder(orderData);

        // Step 5: Save video URLs if present
        await saveVideoUrls(orderId, videos);

        // Step 6: Fetch complete order data
        const completeOrder = await fetchCreatedOrder(orderId);

        setStage('completed', 100);

        updateState({ 
          createdOrder: completeOrder,
          isLoading: false,
          stage: 'completed',
          progress: 100
        });

        toast({
          title: "Заказ создан успешно!",
          description: `Заказ #${completeOrder.order_number} готов к обработке`,
        });

      } catch (error) {
        handleError(error, submitOperation);
      }
    };

    // Store the operation for potential retry
    updateState({ lastOperation: submitOperation });
    await submitOperation();
  }, [
    updateState,
    validateFormData,
    fetchBuyerByOptId,
    createOrder,
    saveVideoUrls,
    fetchCreatedOrder,
    setStage,
    handleError
  ]);

  const handleOrderUpdate = useCallback((updatedOrder: any) => {
    updateState({ createdOrder: updatedOrder });
  }, [updateState]);

  const resetCreatedOrder = useCallback(() => {
    updateState({ 
      createdOrder: null, 
      error: null, 
      stage: '', 
      progress: 0,
      retryCount: 0,
      lastOperation: null
    });
  }, [updateState]);

  return {
    isLoading: state.isLoading,
    stage: state.stage,
    progress: state.progress,
    createdOrder: state.createdOrder,
    error: state.error,
    retryCount: state.retryCount,
    handleSubmit,
    handleOrderUpdate,
    resetCreatedOrder,
    retryLastOperation: retryOperation,
    clearError
  };
};
