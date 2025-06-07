

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { OrderFormData } from './useOrderForm';
import { Database } from '@/integrations/supabase/types';

type OrderStatus = Database["public"]["Enums"]["order_status"];
type OrderCreatedType = Database["public"]["Enums"]["order_created_type"];
type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

interface UseOrderSubmissionProps {
  productId?: string | null;
  onOrderCreated: (order: any) => void;
}

export const useOrderSubmission = ({ productId, onOrderCreated }: UseOrderSubmissionProps) => {
  const { user, profile } = useAuth();

  const submitOrder = async (formData: OrderFormData, images: string[], videos: string[]) => {
    if (!user) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания заказа",
        variant: "destructive",
      });
      return;
    }

    // Validation
    const errors = [];
    if (!formData.title.trim()) errors.push('Наименование обязательно');
    if (!formData.price || parseFloat(formData.price) <= 0) errors.push('Укажите корректную цену');
    if (!formData.buyerOptId) errors.push('Выберите покупателя');

    if (errors.length > 0) {
      toast({
        title: "Ошибки в форме",
        description: errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    try {
      // Get buyer data
      const { data: buyerData, error: buyerError } = await supabase
        .from('profiles')
        .select('id, full_name, telegram')
        .eq('opt_id', formData.buyerOptId)
        .maybeSingle();

      if (buyerError) throw buyerError;

      if (!buyerData?.id) {
        toast({
          title: "Ошибка",
          description: "Не удалось найти получателя с указанным OPT ID",
          variant: "destructive",
        });
        return;
      }

      // Check product availability
      if (productId) {
        const { data: currentProduct, error: productCheckError } = await supabase
          .from('products')
          .select('status')
          .eq('id', productId)
          .single();
          
        if (productCheckError) {
          console.error('Error checking product status:', productCheckError);
          throw new Error('Failed to verify product availability');
        }
        
        if (currentProduct.status !== 'active') {
          toast({
            title: "Товар недоступен",
            description: "Этот товар уже продан или недоступен для заказа",
            variant: "destructive",
          });
          return;
        }
      }

      // Get next order number
      const { data: existingOrders, error: ordersError } = await supabase
        .from('orders')
        .select('order_number')
        .order('order_number', { ascending: true });

      if (ordersError) {
        console.error("Error getting existing order numbers:", ordersError);
        throw ordersError;
      }

      let nextOrderNumber = 1;
      if (existingOrders && existingOrders.length > 0) {
        const orderNumbers = existingOrders.map(order => order.order_number).sort((a, b) => a - b);
        
        for (let i = 0; i < orderNumbers.length; i++) {
          if (orderNumbers[i] !== i + 1) {
            nextOrderNumber = i + 1;
            break;
          }
        }
        
        if (nextOrderNumber === 1 && orderNumbers.length > 0) {
          nextOrderNumber = orderNumbers[orderNumbers.length - 1] + 1;
        }
      }

      const deliveryPrice = formData.delivery_price ? parseFloat(formData.delivery_price) : null;
      
      const orderPayload = {
        order_number: nextOrderNumber,
        title: formData.title,
        price: parseFloat(formData.price),
        place_number: parseInt(formData.place_number),
        seller_id: user.id,
        order_seller_name: profile?.full_name || 'Unknown',
        seller_opt_id: profile?.opt_id || null,
        buyer_id: buyerData.id,
        brand: formData.brand,
        model: formData.model,
        status: 'seller_confirmed' as OrderStatus,
        order_created_type: 'free_order' as OrderCreatedType,
        telegram_url_order: buyerData.telegram || null,
        images: images,
        video_url: videos,
        product_id: productId || null,
        delivery_method: formData.deliveryMethod as DeliveryMethod,
        text_order: formData.text_order || null,
        delivery_price_confirm: deliveryPrice,
      };

      const { data: createdOrderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderPayload)
        .select();

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      const createdOrder = createdOrderData?.[0];

      if (!createdOrder) {
        throw new Error("Order was created but no data was returned");
      }
      
      // Update product status if needed
      if (productId) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ status: 'sold' })
          .eq('id', productId);

        if (updateError) {
          console.error("Error updating product status:", updateError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но статус товара не обновился. Пожалуйста, сообщите администратору.",
            variant: "destructive",
          });
        }
      }

      // Save images
      if (images.length > 0) {
        const imageInserts = images.map((url) => ({
          order_id: createdOrder.id,
          url,
          is_primary: false
        }));

        const { error: imagesError } = await supabase
          .from('order_images')
          .insert(imageInserts);

        if (imagesError) {
          console.error("Error saving image references:", imagesError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но возникла проблема с сохранением изображений",
            variant: "destructive"
          });
        }
      }

      // Save videos (both in video_url array and order_videos table for compatibility)
      if (videos.length > 0) {
        const videoRecords = videos.map(url => ({
          order_id: createdOrder.id,
          url
        }));
        
        const { error: videosError } = await supabase
          .from('order_videos')
          .insert(videoRecords);
          
        if (videosError) {
          console.error("Error saving video records:", videosError);
          toast({
            title: "Предупреждение",
            description: "Заказ создан, но возникла проблема с сохранением видео",
            variant: "destructive"
          });
        }
      }

      // Send Telegram notification
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { ...createdOrder, images, videos },
            action: 'create'
          }
        });
      } catch (notifyError) {
        console.error('Failed to send order notification:', notifyError);
      }

      onOrderCreated(createdOrder);
      toast({
        title: "Заказ создан",
        description: "Ваш заказ был успешно создан",
      });

    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при создании заказа",
        variant: "destructive",
      });
      throw error;
    }
  };

  return { submitOrder };
};

