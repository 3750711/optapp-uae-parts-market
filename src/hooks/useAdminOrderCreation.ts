
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
          brand: selectedProduct.brand,
          model: selectedProduct.model,
          delivery_price: selectedProduct.delivery_price,
          images_count: selectedProduct.product_images?.length || 0,
          product_images: selectedProduct.product_images
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
          orderImages_count: orderData.orderImages.length,
          orderImages: orderData.orderImages
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

      // 📸 ИСПРАВЛЕНИЕ: Объединяем изображения товара с дополнительными изображениями из формы
      const productImages = selectedProduct.product_images?.map(img => img.url) || [];
      console.log("📸 Product images from selectedProduct:", {
        product_images_raw: selectedProduct.product_images,
        product_images_urls: productImages,
        count: productImages.length
      });

      const additionalImages = orderData.orderImages || [];
      console.log("📸 Additional images from orderData:", {
        orderImages: additionalImages,
        count: additionalImages.length
      });

      // Объединяем: сначала изображения товара, потом дополнительные
      const combinedImages = [...productImages, ...additionalImages];
      console.log("📸 Combined images:", {
        productImages_count: productImages.length,
        additionalImages_count: additionalImages.length,
        combinedImages_count: combinedImages.length,
        combinedImages: combinedImages
      });

      // 💰 ИСПРАВЛЕНИЕ: Определяем стоимость доставки по приоритету
      let finalDeliveryPrice = null;
      
      // Приоритет 1: данные из формы (orderData.deliveryPrice)
      if (orderData.deliveryPrice !== undefined && orderData.deliveryPrice !== null) {
        finalDeliveryPrice = orderData.deliveryPrice;
        console.log("💰 Using delivery price from form:", finalDeliveryPrice);
      }
      // Приоритет 2: данные из товара (selectedProduct.delivery_price)
      else if (selectedProduct.delivery_price !== undefined && selectedProduct.delivery_price !== null) {
        finalDeliveryPrice = selectedProduct.delivery_price;
        console.log("💰 Using delivery price from product:", finalDeliveryPrice);
      }
      
      console.log("💰 Final delivery price logic:", {
        formDeliveryPrice: orderData.deliveryPrice,
        productDeliveryPrice: selectedProduct.delivery_price,
        finalDeliveryPrice: finalDeliveryPrice
      });

      // 🚗 ИСПРАВЛЕНИЕ: Обрабатываем модель товара (может быть null)
      const productModel = selectedProduct.model || '';
      console.log("🚗 Product model processing:", {
        original_model: selectedProduct.model,
        processed_model: productModel
      });

      // Используем RPC функцию для создания заказа администратором
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price, // Приоритет цене из формы
        p_place_number: 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: selectedSeller.full_name, // ✅ ИСПРАВЛЕНО: Передаем имя продавца
        p_seller_opt_id: selectedSeller.opt_id, // ✅ ИСПРАВЛЕНО: Передаем OPT_ID продавца
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: productModel, // ✅ ИСПРАВЛЕНО: Обработанная модель
        p_status: 'admin_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: null,
        p_images: combinedImages, // ✅ ИСПРАВЛЕНО: Объединенные изображения
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: finalDeliveryPrice // ✅ ИСПРАВЛЕНО: Стоимость доставки
      };

      console.log("✅ Final RPC payload with FIXES:", orderPayload);

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

      // 🔍 РАСШИРЕННАЯ ВАЛИДАЦИЯ созданного заказа
      console.log("🔍 DETAILED validation of created order data:", {
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
        title: createdOrder.title,
        price: createdOrder.price,
        delivery_price_confirm: createdOrder.delivery_price_confirm,
        order_seller_name: createdOrder.order_seller_name,
        seller_opt_id: createdOrder.seller_opt_id,
        buyer_opt_id: createdOrder.buyer_opt_id,
        brand: createdOrder.brand,
        model: createdOrder.model,
        product_id: createdOrder.product_id,
        images_count: createdOrder.images?.length || 0,
        images: createdOrder.images,
        delivery_method: createdOrder.delivery_method
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
      
      // ✅ НОВАЯ ПРОВЕРКА: Изображения
      if (!createdOrder.images || createdOrder.images.length === 0) {
        console.warn("⚠️ No images saved in order - this is the main issue!");
        validationErrors.push('Изображения товара не сохранились');
      } else {
        console.log("✅ Images successfully saved:", createdOrder.images);
      }

      // ✅ НОВАЯ ПРОВЕРКА: Стоимость доставки
      if (finalDeliveryPrice !== null && createdOrder.delivery_price_confirm !== finalDeliveryPrice) {
        console.warn("⚠️ Delivery price mismatch:", {
          expected: finalDeliveryPrice,
          actual: createdOrder.delivery_price_confirm
        });
        validationErrors.push('Стоимость доставки не сохранилась корректно');
      }

      // ✅ НОВАЯ ПРОВЕРКА: Модель
      if (selectedProduct.model && !createdOrder.model) {
        console.warn("⚠️ Model not saved:", {
          expected: selectedProduct.model,
          actual: createdOrder.model
        });
        validationErrors.push('Модель товара не сохранилась');
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
