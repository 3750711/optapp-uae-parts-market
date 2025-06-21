
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
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
      // Валидация delivery_method
      const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
      if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
        throw new Error(`Invalid delivery method: ${orderData.deliveryMethod}`);
      }

      // Используем RPC функцию для создания заказа администратором
      // Приводим к тому же формату, что работает в свободном заказе
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price,
        p_place_number: 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: null, // ✅ null - триггер установит автоматически
        p_seller_opt_id: null,     // ✅ null - триггер установит автоматически
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: selectedProduct.model || '',
        p_status: 'created' as const, // ✅ Используем тот же статус, что в свободном заказе
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: null, // ✅ null - триггер установит
        p_images: orderData.orderImages,
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: orderData.deliveryPrice || null
      };

      console.log("✅ Fixed RPC payload (aligned with free order logic):", orderPayload);

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

      // Получаем данные созданного заказа для Telegram уведомления
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching created order:", fetchError);
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
        description: `Заказ успешно создан`,
      });

      return orderId;

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
