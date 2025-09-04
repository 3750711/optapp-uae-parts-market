import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FreeOrderFormData {
  title: string;
  price: string;
  sellerId: string;
  buyerOptId: string;
  brand: string;
  model: string;
  description?: string;
  place_number?: string;
  delivery_price?: string;
  text_order?: string;
}

interface SubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
}

export const useAdminFreeOrderSubmission = () => {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isLoading: false,
    stage: '',
    progress: 0,
    createdOrder: null,
    error: null,
  });

  const handleSubmit = useCallback(async (
    formData: FreeOrderFormData,
    images: string[],
    videos: string[]
  ) => {
    try {
      setSubmissionState({
        isLoading: true,
        stage: 'Создание заказа...',
        progress: 10,
        createdOrder: null,
        error: null,
      });

      // Validate required fields
      if (!formData.title || !formData.price || !formData.sellerId || !formData.buyerOptId) {
        throw new Error('Заполните все обязательные поля');
      }

      // Parse numeric values
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        throw new Error('Цена должна быть положительным числом');
      }

      const placeNumber = formData.place_number ? parseInt(formData.place_number) : 1;
      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;

      setSubmissionState(prev => ({
        ...prev,
        stage: 'Отправка данных на сервер...',
        progress: 50,
      }));

      // Call the specialized admin_create_free_order function
      const { data: orderId, error } = await supabase.rpc('admin_create_free_order', {
        p_title: formData.title,
        p_price: price,
        p_seller_id: formData.sellerId,
        p_buyer_opt_id: formData.buyerOptId,
        p_brand: formData.brand || '',
        p_model: formData.model || '',
        p_description: formData.description || '',
        p_images: images,
        p_video_url: videos,
        p_delivery_method: 'self_pickup',
        p_place_number: placeNumber,
        p_delivery_price_confirm: deliveryPrice,
        p_text_order: formData.text_order || '',
      });

      if (error) {
        console.error('Error creating free order:', error);
        throw new Error(`Ошибка создания заказа: ${error.message}`);
      }

      setSubmissionState(prev => ({
        ...prev,
        stage: 'Получение данных заказа...',
        progress: 75,
      }));

      // Fetch the created order
      const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching created order:', fetchError);
        throw new Error('Заказ создан, но произошла ошибка при получении данных');
      }

      setSubmissionState({
        isLoading: false,
        stage: 'Завершено',
        progress: 100,
        createdOrder: order,
        error: null,
      });

      toast({
        title: "Заказ успешно создан",
        description: `Свободный заказ #${order.order_number} создан и подтвержден`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      setSubmissionState({
        isLoading: false,
        stage: 'Ошибка',
        progress: 0,
        createdOrder: null,
        error: errorMessage,
      });

      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  }, []);

  const resetCreatedOrder = useCallback(() => {
    setSubmissionState(prev => ({
      ...prev,
      createdOrder: null,
      error: null,
      stage: '',
      progress: 0,
    }));
  }, []);

  const clearError = useCallback(() => {
    setSubmissionState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...submissionState,
    handleSubmit,
    resetCreatedOrder,
    clearError,
  };
};