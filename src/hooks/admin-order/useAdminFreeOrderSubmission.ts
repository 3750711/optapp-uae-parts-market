import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { OrderFormData } from '@/types/order';

interface FreeOrderSubmissionState {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
}

interface FreeOrderSubmissionResult {
  isLoading: boolean;
  stage: string;
  progress: number;
  createdOrder: any;
  error: string | null;
  handleSubmit: (formData: OrderFormData, images: string[], videos: string[]) => Promise<void>;
  resetCreatedOrder: () => void;
  clearError: () => void;
}

export const useAdminFreeOrderSubmission = (): FreeOrderSubmissionResult => {
  const [state, setState] = useState<FreeOrderSubmissionState>({
    isLoading: false,
    stage: '',
    progress: 0,
    createdOrder: null,
    error: null,
  });

  const handleSubmit = useCallback(async (
    formData: OrderFormData,
    images: string[],
    videos: string[]
  ) => {
    try {
      setState(prev => ({
        ...prev,
        isLoading: true,
        stage: 'Создание свободного заказа...',
        progress: 25,
        error: null
      }));

      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error('Название товара обязательно');
      }
      if (!formData.price || Number(formData.price) <= 0) {
        throw new Error('Цена должна быть больше 0');
      }
      if (!formData.sellerId) {
        throw new Error('Продавец должен быть выбран');
      }
      if (!formData.buyerOptId?.trim()) {
        throw new Error('OPT_ID покупателя обязателен');
      }

      setState(prev => ({ ...prev, progress: 50 }));

      // Find buyer by opt_id
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('profiles')
        .select('id')
        .eq('opt_id', formData.buyerOptId.trim())
        .single();

      if (buyerError || !buyerProfile) {
        throw new Error(`Покупатель с OPT_ID "${formData.buyerOptId}" не найден`);
      }

      // Get seller info
      const { data: sellerProfile, error: sellerError } = await supabase
        .from('profiles')
        .select('full_name, opt_id')
        .eq('id', formData.sellerId)
        .single();

      if (sellerError || !sellerProfile) {
        throw new Error('Продавец не найден');
      }

      setState(prev => ({ ...prev, progress: 60 }));

      // Call the admin_create_order function with correct parameter order matching DB signature
      const { data: orderId, error } = await supabase.rpc('admin_create_order', {
        p_title: formData.title.trim(),
        p_price: Number(formData.price),
        p_seller_id: formData.sellerId,
        p_buyer_id: buyerProfile.id,
        p_status: 'admin_confirmed',
        p_quantity: 1,
        p_delivery_method: formData.deliveryMethod || 'self_pickup',
        p_place_number: Number(formData.place_number) || 1,
        p_delivery_price_confirm: formData.delivery_price ? Number(formData.delivery_price) : null,
        p_product_id: null,
        p_brand: formData.brand?.trim() || '',
        p_model: formData.model?.trim() || '',
        p_description: formData.description?.trim() || '',
        p_images: images.length > 0 ? images : [],
        p_video_url: videos.length > 0 ? videos : [],
        p_text_order: formData.text_order?.trim() || ''
      });

      if (error) {
        console.error('Error creating free order:', error);
        throw new Error(error.message);
      }

      setState(prev => ({ ...prev, progress: 75 }));

      // Fetch the created order details
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('Error fetching order:', fetchError);
        throw new Error('Заказ создан, но не удалось получить его данные');
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: 'Заказ успешно создан',
        progress: 100,
        createdOrder: orderData
      }));

      toast({
        title: "Свободный заказ создан",
        description: `Заказ #${orderData.order_number} успешно создан`,
      });

    } catch (error) {
      console.error('Free order submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        stage: '',
        progress: 0,
        error: errorMessage
      }));

      toast({
        variant: "destructive",
        title: "Ошибка создания заказа",
        description: errorMessage,
      });
    }
  }, []);

  const resetCreatedOrder = useCallback(() => {
    setState(prev => ({
      ...prev,
      createdOrder: null,
      stage: '',
      progress: 0
    }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    isLoading: state.isLoading,
    stage: state.stage,
    progress: state.progress,
    createdOrder: state.createdOrder,
    error: state.error,
    handleSubmit,
    resetCreatedOrder,
    clearError,
  };
};