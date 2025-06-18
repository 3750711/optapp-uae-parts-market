
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types/product';
import { SellerProfile, BuyerProfile } from '@/types/order';

export const useAdminOrderCreation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const validateOrderData = (
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
    console.log('Validating order data:', {
      seller: selectedSeller,
      product: selectedProduct,
      buyer: selectedBuyer,
      orderData
    });

    // Validate seller
    if (!selectedSeller?.id || !selectedSeller?.full_name || !selectedSeller?.opt_id) {
      throw new Error('Данные продавца неполные');
    }

    // Validate product
    if (!selectedProduct?.id || !selectedProduct?.title || !selectedProduct?.price) {
      throw new Error('Данные товара неполные');
    }

    if (selectedProduct.price <= 0) {
      throw new Error('Цена товара должна быть больше нуля');
    }

    // Validate buyer
    if (!selectedBuyer?.id || !selectedBuyer?.full_name || !selectedBuyer?.opt_id) {
      throw new Error('Данные покупателя неполные');
    }

    // Validate order data
    if (!orderData.price || orderData.price <= 0) {
      throw new Error('Цена заказа должна быть больше нуля');
    }

    if (!orderData.deliveryMethod) {
      throw new Error('Метод доставки не указан');
    }

    const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
    if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
      throw new Error(`Недопустимый метод доставки: ${orderData.deliveryMethod}`);
    }

    console.log('✅ Order data validation passed');
    return true;
  };

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
      // Validate all data before proceeding
      validateOrderData(selectedSeller, selectedProduct, selectedBuyer, orderData);

      console.log('Creating order with cloudinary data:', {
        productId: selectedProduct.id,
        cloudinaryPublicId: selectedProduct.cloudinary_public_id,
        images: orderData.orderImages
      });

      // Use RPC function to create order as admin
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price,
        p_place_number: 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: selectedSeller.full_name,
        p_seller_opt_id: selectedSeller.opt_id || '',
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: selectedProduct.model || '',
        p_status: 'seller_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: selectedBuyer.telegram || '',
        p_images: orderData.orderImages,
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: orderData.deliveryPrice || null
      };

      console.log("RPC payload with validation:", orderPayload);

      const { data: orderId, error: orderError } = await supabase
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("Detailed RPC error:", {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code
        });
        
        // Handle specific errors from database
        if (orderError.message?.includes('Product is not available for order') || 
            orderError.message?.includes('Product with ID') ||
            orderError.code === 'P0001') {
          toast({
            title: "Товар недоступен",
            description: "Этот товар уже продан или недоступен для заказа",
            variant: "destructive",
          });
          return 'product_unavailable';
        }
        
        if (orderError.message?.includes('An active order already exists') ||
            orderError.code === 'P0002') {
          toast({
            title: "Заказ уже существует",
            description: "Для этого товара уже создан активный заказ",
            variant: "destructive",
          });
          return 'order_exists';
        }

        if (orderError.code === '23505') {
          toast({
            title: "Дублирование данных",
            description: "Заказ с такими данными уже существует",
            variant: "destructive",
          });
          return 'duplicate_order';
        }

        if (orderError.code === '23503') {
          toast({
            title: "Ошибка связей",
            description: "Один из указанных пользователей или товаров не найден",
            variant: "destructive",
          });
          return 'foreign_key_error';
        }
        
        throw orderError;
      }

      console.log("Order created successfully with ID:", orderId);

      // Get created order data for Telegram notification
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("Error fetching created order for notification:", fetchError);
      }

      // Send Telegram notification about order creation
      if (createdOrder) {
        try {
          console.log("Sending Telegram notification for order creation:", createdOrder);
          
          const { error: notificationError } = await supabase.functions.invoke('send-telegram-notification', {
            body: {
              order: createdOrder,
              action: 'create'
            }
          });

          if (notificationError) {
            console.error("Error sending order creation notification:", notificationError);
          } else {
            console.log("Order creation notification sent successfully");
          }
        } catch (notificationError) {
          console.error("Exception while sending order notification:", notificationError);
        }
      }

      toast({
        title: "Заказ создан",
        description: `Заказ успешно создан с изображениями`,
      });

      return orderId;

    } catch (error) {
      console.error("Detailed error creating order:", {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
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
