
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OrderFormData } from '@/components/admin/order/types';
import { CreatedOrder, SubmissionState, BuyerProfile } from './types';
import { useAdminOrderValidation } from './useAdminOrderValidation';

export const useAdminOrderSubmission = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { validateForm, getSellerName } = useAdminOrderValidation();

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
      console.log('🚀 Starting order submission process');

      // Use updated validation that returns both errors and buyer
      const { errors: validationErrors, buyer } = await validateForm(formData);
      if (validationErrors.length > 0) {
        console.log('❌ Validation errors:', validationErrors);
        toast({
          title: "Ошибки валидации",
          description: validationErrors.map(e => e.message).join('. '),
          variant: "destructive"
        });
        return;
      }

      // Check that buyer was found
      if (!buyer) {
        console.log('❌ No buyer found after validation');
        throw new Error(`Покупатель с OPT_ID "${formData.buyerOptId}" не найден`);
      }

      console.log('✅ Using cached buyer from validation:', buyer);
      setSubmissionState(prev => ({ ...prev, stage: 'creating_order', progress: 50 }));

      const sellerIdToUse = formData.sellerId || user?.id;
      const sellerName = sellerIdToUse ? await getSellerName(sellerIdToUse) : 'Unknown Seller';

      console.log('📝 Creating order with data:', {
        title: formData.title,
        buyerId: buyer.id,
        buyerOptId: buyer.opt_id,
        sellerId: sellerIdToUse,
        sellerName,
        videosCount: videos.length
      });

      const { data: order, error } = await supabase.rpc('admin_create_order', {
        p_title: formData.title.trim(),
        p_price: parseFloat(formData.price),
        p_place_number: parseInt(formData.place_number) || 1,
        p_seller_id: sellerIdToUse,
        p_order_seller_name: sellerName,
        p_seller_opt_id: '',
        p_buyer_id: buyer.id, // Use ID of found buyer
        p_brand: formData.brand?.trim() || '',
        p_model: formData.model?.trim() || '',
        p_status: 'created',
        p_order_created_type: 'free_order',
        p_telegram_url_order: '',
        p_images: images,
        p_product_id: null,
        p_delivery_method: formData.deliveryMethod,
        p_text_order: formData.text_order?.trim() || '',
        p_delivery_price_confirm: parseFloat(formData.delivery_price) || 0
      });

      if (error) {
        console.error('❌ RPC call failed:', error);
        throw new Error(`Ошибка создания заказа: ${error.message}`);
      }

      console.log('✅ Order created successfully:', order);
      setSubmissionState(prev => ({ ...prev, stage: 'saving_videos', progress: 70 }));

      // Save videos if any
      if (videos.length > 0) {
        console.log('💾 Saving videos to database:', videos);
        const videoInserts = videos.map(videoUrl => ({
          order_id: order,
          url: videoUrl
        }));

        const { error: videoError } = await supabase
          .from('order_videos')
          .insert(videoInserts);

        if (videoError) {
          console.error('❌ Failed to save videos:', videoError);
          // Don't fail the whole operation, just log
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но не удалось сохранить видео",
            variant: "destructive"
          });
        } else {
          console.log('✅ Videos saved successfully');
        }
      }

      setSubmissionState(prev => ({ ...prev, stage: 'fetching_order', progress: 90 }));

      const { data: fetchedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', order)
        .maybeSingle();

      if (fetchError || !fetchedOrder) {
        console.error('❌ Failed to fetch created order:', fetchError);
        throw new Error('Ошибка получения созданного заказа');
      }

      setSubmissionState(prev => ({ ...prev, stage: 'completed', progress: 100 }));
      setCreatedOrder(fetchedOrder as CreatedOrder);

      console.log('🎉 Order submission completed successfully');
      toast({
        title: "Заказ создан",
        description: `Заказ #${fetchedOrder.order_number} успешно создан`,
      });

    } catch (error) {
      console.error('❌ Order creation error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Произошла неожиданная ошибка";
      
      toast({
        title: "Ошибка создания заказа",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmissionState(prev => ({ ...prev, isLoading: false }));
    }
  }, [validateForm, getSellerName, user?.id, toast]);

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
