
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '@/components/admin/order/types';
import { CreatedOrder, SubmissionState } from './types';
import { useAdminOrderValidation } from './useAdminOrderValidation';

export const useAdminOrderSubmission = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { validateForm, findBuyerByOptId, getSellerName } = useAdminOrderValidation();

  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    isLoading: false,
    stage: '',
    progress: 0
  });

  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);

  const handleSubmit = useCallback(async (
    formData: OrderFormData, 
    images: string[], 
    videos: string[]
  ): Promise<void> => {
    try {
      setSubmissionState({ isLoading: true, stage: 'validating', progress: 10 });

      const validationErrors = await validateForm(formData);
      if (validationErrors.length > 0) {
        toast({
          title: "Ошибки валидации",
          description: validationErrors.map(e => e.message).join('. '),
          variant: "destructive"
        });
        return;
      }

      setSubmissionState(prev => ({ ...prev, stage: 'fetching_buyer', progress: 30 }));

      const buyer = await findBuyerByOptId(formData.buyerOptId.trim());
      if (!buyer) {
        throw new Error(`Покупатель с OPT_ID "${formData.buyerOptId}" не найден`);
      }

      setSubmissionState(prev => ({ ...prev, stage: 'creating_order', progress: 50 }));

      const sellerIdToUse = formData.sellerId || user?.id;
      const sellerName = sellerIdToUse ? await getSellerName(sellerIdToUse) : 'Unknown Seller';

      const { data: order, error } = await supabase.rpc('admin_create_order', {
        p_title: formData.title.trim(),
        p_price: parseFloat(formData.price),
        p_place_number: parseInt(formData.place_number) || 1,
        p_seller_id: sellerIdToUse,
        p_order_seller_name: sellerName,
        p_seller_opt_id: '',
        p_buyer_id: buyer.id,
        p_brand: formData.brand?.trim() || '',
        p_model: formData.model?.trim() || '',
        p_status: 'created',
        p_order_created_type: 'free',
        p_telegram_url_order: '',
        p_images: images,
        p_product_id: null,
        p_delivery_method: formData.deliveryMethod,
        p_text_order: formData.text_order?.trim() || '',
        p_delivery_price_confirm: parseFloat(formData.delivery_price) || 0
      });

      if (error) {
        throw new Error(`Ошибка создания заказа: ${error.message}`);
      }

      setSubmissionState(prev => ({ ...prev, stage: 'fetching_order', progress: 80 }));

      const { data: fetchedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order)
        .maybeSingle();

      if (fetchError || !fetchedOrder) {
        throw new Error('Ошибка получения созданного заказа');
      }

      setSubmissionState(prev => ({ ...prev, stage: 'completed', progress: 100 }));
      setCreatedOrder(fetchedOrder as CreatedOrder);

      toast({
        title: "Заказ создан",
        description: `Заказ #${fetchedOrder.order_number} успешно создан`,
      });

    } catch (error) {
      console.error('Order creation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Произошла неожиданная ошибка";
      
      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmissionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [validateForm, findBuyerByOptId, getSellerName, user?.id, toast]);

  const handleOrderUpdate = useCallback((order: CreatedOrder) => {
    setCreatedOrder(order);
  }, []);

  return {
    ...submissionState,
    createdOrder,
    handleSubmit,
    handleOrderUpdate
  };
};
