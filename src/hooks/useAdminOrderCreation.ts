
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SellerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  status: string;
  product_images?: { url: string; is_primary?: boolean }[];
  delivery_price?: number;
  lot_number: number;
}

export const useAdminOrderCreation = () => {
  const { toast } = useToast();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const createOrder = useCallback(async (
    selectedSeller: SellerProfile,
    selectedProduct: Product,
    selectedBuyer: BuyerProfile,
    orderData: {
      price: number;
      deliveryPrice?: number;
      deliveryMethod: string;
      orderImages: string[];
    }
  ) => {
    if (isCreatingOrder) {
      console.log("Order creation already in progress, ignoring duplicate request");
      return null;
    }

    setIsCreatingOrder(true);

    try {
      // Валидация входных данных
      console.log("🔍 Validating input data:", {
        selectedSeller: {
          id: selectedSeller.id,
          full_name: selectedSeller.full_name,
          opt_id: selectedSeller.opt_id
        },
        selectedProduct: {
          id: selectedProduct.id,
          title: selectedProduct.title,
          price: selectedProduct.price,
          delivery_price: selectedProduct.delivery_price,
          images_count: selectedProduct.product_images?.length || 0
        },
        selectedBuyer: {
          id: selectedBuyer.id,
          full_name: selectedBuyer.full_name,
          opt_id: selectedBuyer.opt_id
        },
        orderData: {
          price: orderData.price,
          deliveryPrice: orderData.deliveryPrice,
          deliveryMethod: orderData.deliveryMethod,
          orderImages_count: orderData.orderImages.length
        }
      });

      // Проверяем критически важные данные
      if (!selectedSeller.full_name || !selectedSeller.opt_id) {
        console.error("❌ Missing seller data:", { full_name: selectedSeller.full_name, opt_id: selectedSeller.opt_id });
        throw new Error('Данные продавца неполны');
      }

      if (!selectedBuyer.opt_id) {
        console.error("❌ Missing buyer opt_id:", selectedBuyer.opt_id);
        throw new Error('OPT_ID покупателя не указан');
      }

      // Валидация delivery_method
      const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
      if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
        throw new Error(`Invalid delivery method: ${orderData.deliveryMethod}`);
      }

      // Объединяем изображения: изображения товара + дополнительные изображения из формы
      const productImages = selectedProduct.product_images?.map(img => img.url) || [];
      const combinedImages = [...productImages, ...orderData.orderImages];
      
      console.log("📸 Images processing:", {
        productImages_count: productImages.length,
        orderImages_count: orderData.orderImages.length,
        combinedImages_count: combinedImages.length,
        combinedImages: combinedImages
      });

      // Определяем стоимость доставки: приоритет данным формы, затем данным товара
      const finalDeliveryPrice = orderData.deliveryPrice !== undefined && orderData.deliveryPrice !== null 
        ? orderData.deliveryPrice 
        : selectedProduct.delivery_price || null;

      console.log("💰 Delivery price logic:", {
        formDeliveryPrice: orderData.deliveryPrice,
        productDeliveryPrice: selectedProduct.delivery_price,
        finalDeliveryPrice: finalDeliveryPrice
      });

      // Используем RPC функцию для создания заказа администратором
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price, // Приоритет цене из формы
        p_place_number: 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: selectedSeller.full_name, // Передаем имя продавца
        p_seller_opt_id: selectedSeller.opt_id, // Передаем OPT_ID продавца
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: selectedProduct.model || '',
        p_status: 'admin_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: null,
        p_images: combinedImages, // Объединенные изображения
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: finalDeliveryPrice
      };

      console.log("✅ Final RPC payload:", orderPayload);

      const { data: orderId, error: orderError } = await supabase
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("❌ Error creating order:", orderError);
        
        // Обработка специфических ошибок от базы данных
        if (orderError.message?.includes('Product is not available for order')) {
          toast({
            title: "Товар недоступен",
            description: "Этот товар уже продан или недоступен для заказа",
            variant: "destructive",
          });
          return 'product_unavailable';
        }
        
        if (orderError.message?.includes('An active order already exists')) {
          toast({
            title: "Заказ уже существует",
            description: "Для этого товара уже создан активный заказ",
            variant: "destructive",
          });
          return 'order_exists';
        }
        
        throw orderError;
      }

      console.log("✅ Order created with ID:", orderId);

      // Получаем данные созданного заказа для валидации
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching created order:", fetchError);
        throw fetchError;
      }

      // Валидируем что все критически важные данные сохранились
      console.log("🔍 Validating created order data:", {
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
        title: createdOrder.title,
        price: createdOrder.price,
        delivery_price_confirm: createdOrder.delivery_price_confirm,
        order_seller_name: createdOrder.order_seller_name,
        seller_opt_id: createdOrder.seller_opt_id,
        buyer_opt_id: createdOrder.buyer_opt_id,
        images_count: createdOrder.images?.length || 0,
        brand: createdOrder.brand,
        model: createdOrder.model,
        product_id: createdOrder.product_id
      });

      // Проверяем критически важные поля
      const validationErrors = [];
      
      if (!createdOrder.order_seller_name || createdOrder.order_seller_name === 'Unknown Seller') {
        validationErrors.push('Имя продавца не сохранилось');
      }
      
      if (!createdOrder.seller_opt_id) {
        validationErrors.push('OPT_ID продавца не сохранился');
      }
      
      if (!createdOrder.buyer_opt_id) {
        validationErrors.push('OPT_ID покупателя не сохранился');
      }
      
      if (!createdOrder.images || createdOrder.images.length === 0) {
        console.warn("⚠️ No images saved in order");
      }

      if (validationErrors.length > 0) {
        console.error("❌ Order validation failed:", validationErrors);
        toast({
          title: "Предупреждение",
          description: `Заказ создан, но есть проблемы: ${validationErrors.join(', ')}`,
          variant: "destructive",
        });
      }

      // Отправляем Telegram уведомление о создании заказа
      if (createdOrder) {
        try {
          console.log("📱 Sending Telegram notification for order creation:", createdOrder);
          
          const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              order: createdOrder,
              action: 'create'
            }
          });

          if (notificationError) {
            console.error("❌ Error sending order creation notification:", notificationError);
          } else {
            console.log("✅ Order creation notification sent successfully");
          }
        } catch (notificationError) {
          console.error("❌ Exception while sending order notification:", notificationError);
        }
      }

      toast({
        title: "Заказ создан",
        description: `Заказ успешно создан со статусом "Подтвержден администратором"`,
      });

      return createdOrder;

    } catch (error) {
      console.error("💥 Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка";
      toast({
        title: "Ошибка создания заказа",
        description: `Детали: ${errorMessage}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCreatingOrder(false);
    }
  }, [toast, isCreatingOrder]);

  return {
    createOrder,
    isCreatingOrder
  };
};
