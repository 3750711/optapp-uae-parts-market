
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { OrderFormData } from './useOrderForm';

interface UseOrderSubmissionProps {
  productId?: string | null;
  onOrderCreated: (order: any) => void;
}

export const useOrderSubmission = ({ productId, onOrderCreated }: UseOrderSubmissionProps) => {
  const { toast } = useToast();

  const submitOrder = useCallback(async (formData: OrderFormData, images: string[], videos: string[]) => {
    try {
      // Простая заглушка для создания заказа
      const orderData = {
        id: Date.now().toString(),
        title: formData.title,
        price: parseFloat(formData.price),
        description: formData.description,
        brand: formData.brand,
        model: formData.model,
        buyer_phone: formData.buyerPhone,
        buyer_name: formData.buyerName,
        images,
        videos,
        status: 'pending',
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
