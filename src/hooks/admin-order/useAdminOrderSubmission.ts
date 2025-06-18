
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { OrderStatus } from '@/types/order';

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

  // Функция для очистки данных заказа от null значений
  const sanitizeOrderData = useCallback((data: any) => {
    return {
      ...data,
      brand: data.brand || '', // Конвертируем null в пустую строку
      model: data.model || '', // Конвертируем null в пустую строку
      text_order: data.text_order || null,
      delivery_price: data.delivery_price || null,
    };
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

  // Валидация статуса заказа
  const validateOrderStatus = useCallback((status: string): OrderStatus => {
    const validStatuses: OrderStatus[] = ['created', 'seller_confirmed', 'admin_confirmed', 'processed', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status as OrderStatus)) {
      console.error(`Invalid order status: ${status}. Using 'created' as fallback.`);
      return 'created'; // Fallback к правильному статусу
    }
    
    return status as OrderStatus;
  }, []);

  const createOrder = useCallback(async (orderData: any) => {
    setStage('creating_order', 40);

    // Очищаем данные от null значений
    const sanitizedData = sanitizeOrderData(orderData);
    
    // Валидируем и исправляем статус
    const validStatus = validateOrderStatus('created'); // Всегда используем 'created' для новых заказов

    console.log('📋 Creating order with validated data:', {
      ...sanitizedData,
      status: validStatus
    });

    const { data: order, error } = await supabase
      .rpc('admin_create_order', {
        p_title: sanitizedData.title,
        p_price: parseFloat(sanitizedData.price),
        p_place_number: parseInt(sanitizedData.place_number) || 1,
        p_seller_id: sanitizedData.seller_id,
        p_order_seller_name: sanitizedData.order_seller_name,
        p_seller_opt_id: sanitizedData.seller_opt_id,
        p_buyer_id: sanitizedData.buyer_id,
        p_brand: sanitizedData.brand, // Теперь всегда строка (пустая или с значением)
        p_model: sanitizedData.model, // Теперь всегда строка (пустая или с значением)
        p_status: validStatus, // Используем проверенный статус
        p_order_created_type: 'free_order',
        p_telegram_url_order: sanitizedData.telegram_url_order || null,
        p_images: sanitizedData.images || [],
        p_product_id: null,
        p_delivery_method: sanitizedData.delivery_method || 'cargo_rf',
        p_text_order: sanitizedData.text_order || null,
        p_delivery_price_confirm: sanitizedData.delivery_price ? parseFloat(sanitizedData.delivery_price) : null
      });

    if (error) {
      console.error('❌ RPC Error:', error);
      throw new Error(`Ошибка создания заказа: ${error.message}`);
    }

    console.log('✅ Order created successfully:', order);
    return order;
  }, [setStage, sanitizeOrderData, validateOrderStatus]);

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

  const sendTelegramNotification = useCallback(async (order: any) => {
    setStage('sending_notification', 90);

    try {
      console.log('Отправка Telegram уведомления для заказа:', order.id);
      
      const { error } = await supabase.functions.invoke('send-telegram-notification', {
        body: {
          order: order,
          action: 'create'
        }
      });

      if (error) {
        console.warn('Ошибка отправки Telegram уведомления:', error);
        // Показываем предупреждение, но не останавливаем процесс
        toast({
          title: "Заказ создан, но уведомление не отправлено",
          description: "Telegram уведомление не удалось отправить, но заказ создан успешно",
          variant: "destructive",
        });
      } else {
        console.log('Telegram уведомление отправлено успешно');
      }
    } catch (error) {
      console.warn('Ошибка при отправке Telegram уведомления:', error);
      // Показываем предупреждение, но не останавливаем процесс
      toast({
        title: "Заказ создан, но уведомление не отправлено",
        description: "Проблема с отправкой Telegram уведомления, но заказ создан успешно",
        variant: "destructive",
      });
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
          brand: formData.brand || '', // Конвертируем null в пустую строку
          model: formData.model || '', // Конвертируем null в пустую строку
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

        // Step 7: Send Telegram notification (non-blocking)
        await sendTelegramNotification(completeOrder);

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
    sendTelegramNotification,
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
