
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrderFormData } from './useOrderForm';
import { normalizeDecimal } from '@/utils/number';

interface UseOrderSubmissionProps {
  productId?: string | null;
  onOrderCreated: (order: any) => void;
}

export const useOrderSubmission = ({ productId, onOrderCreated }: UseOrderSubmissionProps) => {
  const { toast } = useToast();

  const submitOrder = useCallback(async (formData: OrderFormData, images: string[], videos: string[]) => {
    try {
      console.log('Submitting order with data:', { formData, images, videos });
      
      // Простая заглушка для создания заказа
      const orderData = {
        id: Date.now().toString(),
        title: formData.title,
        price: normalizeDecimal(formData.price),
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        buyer_phone: formData.buyerPhone,
        buyer_name: formData.buyerName,
        buyer_opt_id: formData.buyerOptId,
        delivery_price: formData.delivery_price ? normalizeDecimal(formData.delivery_price) : 0,
        place_number: formData.place_number ? parseInt(formData.place_number) : 1,
        images,
        videos,
        status: 'created',
        created_at: new Date().toISOString()
      };

      // Здесь должна быть реальная логика создания заказа
      console.log('Creating order:', orderData);

      toast({
        title: "Заказ создан",
        description: "Ваш заказ успешно создан",
      });

      onOrderCreated(orderData);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать заказ",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast, onOrderCreated]);

  return {
    submitOrder
  };
};
