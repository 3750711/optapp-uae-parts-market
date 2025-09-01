
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import { deduplicateArray } from '@/utils/deduplication';
import { checkProductStatus } from '@/utils/productStatusChecker';
import { getCommonTranslations } from '@/utils/translations/common';
import { useLanguage } from '@/hooks/useLanguage';

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

export const useAdminOrderCreation = () => {
  const { toast } = useToast();
  const { language } = useLanguage();
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
      // Валидация входных данных с расширенным логированием
      console.log("🔍 DETAILED validation of input data:", {
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
          product_images_detailed: selectedProduct.product_images
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
          orderImages_detailed: orderData.orderImages
        }
      });

      // 🔍 КРИТИЧЕСКАЯ ПРОВЕРКА: Проверяем статус товара перед созданием заказа
      console.log("🔍 Checking product status before order creation...");
      const c = getCommonTranslations(language);
      
      try {
        const productStatusResult = await checkProductStatus(selectedProduct.id);
        console.log("📋 Product status check result:", productStatusResult);
        
        if (!productStatusResult.isAvailable) {
          console.error("❌ Product is not available for order:", {
            productId: selectedProduct.id,
            status: productStatusResult.status,
            productTitle: selectedProduct.title
          });
          
          toast({
            title: c.errors.title,
            description: c.messages.productAlreadySold,
            variant: "destructive",
          });
          
          return 'product_unavailable';
        }
        
        console.log("✅ Product is available for order creation");
      } catch (error) {
        console.error("❌ Failed to check product status:", error);
        
        toast({
          title: c.errors.title,
          description: c.messages.productStatusCheckError,
          variant: "destructive",
        });
        
        throw error;
      }

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

      // 📸 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Детальная обработка изображений
      const productImages = selectedProduct.product_images?.map(img => img.url) || [];
      console.log("📸 DETAILED Product images processing:", {
        product_images_raw: selectedProduct.product_images,
        product_images_urls: productImages,
        product_images_count: productImages.length,
        each_product_image: selectedProduct.product_images?.map((img, idx) => ({ 
          index: idx, 
          url: img.url, 
          is_primary: img.is_primary 
        }))
      });

      const additionalImages = orderData.orderImages || [];
      console.log("📸 DETAILED Additional images processing:", {
        orderImages_raw: orderData.orderImages,
        additional_images: additionalImages,
        additional_images_count: additionalImages.length
      });

      // Объединяем и дедуплицируем: сначала изображения товара, потом дополнительные
      const combinedImagesWithDuplicates = [...productImages, ...additionalImages];
      const combinedImages = deduplicateArray(combinedImagesWithDuplicates);
      
      console.log("📸 DETAILED Combined images with deduplication:", {
        productImages_count: productImages.length,
        additionalImages_count: additionalImages.length,
        combinedWithDuplicates_count: combinedImagesWithDuplicates.length,
        combinedImages_count: combinedImages.length,
        duplicates_removed: combinedImagesWithDuplicates.length - combinedImages.length,
        combinedImages_full: combinedImages,
        combinedImages_preview: combinedImages.slice(0, 3),
        deduplication_applied: true
      });

      // 💰 КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Детальная обработка стоимости доставки  
      let finalDeliveryPrice = null;
      
      console.log("💰 DETAILED Delivery price processing:", {
        step1_form_delivery_price: orderData.deliveryPrice,
        step1_form_delivery_price_type: typeof orderData.deliveryPrice,
        step2_product_delivery_price: selectedProduct.delivery_price,
        step2_product_delivery_price_type: typeof selectedProduct.delivery_price,
        step3_delivery_method: orderData.deliveryMethod
      });

      // Приоритет 1: данные из формы (orderData.deliveryPrice)
      if (orderData.deliveryPrice !== undefined && orderData.deliveryPrice !== null && orderData.deliveryPrice > 0) {
        finalDeliveryPrice = orderData.deliveryPrice;
        console.log("💰 DETAILED Using delivery price from form:", {
          finalDeliveryPrice,
          source: 'form',
          original_value: orderData.deliveryPrice
        });
      }
      // Приоритет 2: данные из товара (selectedProduct.delivery_price)
      else if (selectedProduct.delivery_price !== undefined && selectedProduct.delivery_price !== null && selectedProduct.delivery_price > 0) {
        finalDeliveryPrice = selectedProduct.delivery_price;
        console.log("💰 DETAILED Using delivery price from product:", {
          finalDeliveryPrice,
          source: 'product',
          original_value: selectedProduct.delivery_price
        });
      }
      
      console.log("💰 DETAILED Final delivery price decision:", {
        formDeliveryPrice: orderData.deliveryPrice,
        productDeliveryPrice: selectedProduct.delivery_price,
        finalDeliveryPrice: finalDeliveryPrice,
        finalDeliveryPrice_type: typeof finalDeliveryPrice,
        will_be_saved: finalDeliveryPrice !== null
      });

      // 🚗 ИСПРАВЛЕНИЕ: Обрабатываем модель товара (может быть null)
      const productModel = selectedProduct.model || '';
      console.log("🚗 DETAILED Product model processing:", {
        original_model: selectedProduct.model,
        original_model_type: typeof selectedProduct.model,
        processed_model: productModel,
        processed_model_type: typeof productModel
      });

      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Подготовка RPC payload с детальным логированием
      const orderPayload = {
        p_title: selectedProduct.title,
        p_price: orderData.price,
        p_place_number: selectedProduct.place_number || 1,
        p_seller_id: selectedSeller.id,
        p_order_seller_name: selectedSeller.full_name,
        p_seller_opt_id: selectedSeller.opt_id,
        p_buyer_id: selectedBuyer.id,
        p_brand: selectedProduct.brand || '',
        p_model: productModel,
        p_status: 'admin_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: null,
        p_images: combinedImages,                    // КРИТИЧНО: передаем объединенные изображения
        p_videos: [],                                // ДОБАВЛЕНО: пустой массив видео для заказов из товаров
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: '',
        p_delivery_price_confirm: finalDeliveryPrice // КРИТИЧНО: передаем финальную стоимость доставки
      };

      console.log("✅ 🔥 CRITICAL FINAL RPC PAYLOAD WITH ALL FIXES:", {
        payload_summary: {
          title: orderPayload.p_title,
          price: orderPayload.p_price,
          images_count: orderPayload.p_images.length,
          delivery_price: orderPayload.p_delivery_price_confirm,
          delivery_method: orderPayload.p_delivery_method,
          product_id: orderPayload.p_product_id
        },
        payload_images_detail: {
          images_array: orderPayload.p_images,
          images_length: orderPayload.p_images.length,
          first_3_images: orderPayload.p_images.slice(0, 3)
        },
        payload_delivery_detail: {
          delivery_price_confirm: orderPayload.p_delivery_price_confirm,
          delivery_price_type: typeof orderPayload.p_delivery_price_confirm,
          delivery_method: orderPayload.p_delivery_method
        },
        full_payload: orderPayload
      });

      // ОТПРАВКА RPC ЗАПРОСА С ЛОГИРОВАНИЕМ
      console.log("🚀 SENDING RPC REQUEST to admin_create_order...");
      const { data: orderId, error: orderError } = await supabase
        .rpc('admin_create_order', orderPayload);

      if (orderError) {
        console.error("❌ RPC ERROR from admin_create_order:", {
          error_message: orderError.message,
          error_details: orderError.details,
          error_hint: orderError.hint,
          error_code: orderError.code,
          sent_payload: orderPayload
        });
        
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

      console.log("✅ RPC SUCCESS - Order created with ID:", orderId);

      // Получаем данные созданного заказа для расширенной валидации
      console.log("🔍 FETCHING created order for validation...");
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("❌ Error fetching created order:", fetchError);
        throw fetchError;
      }

      // 🔍 КРИТИЧЕСКАЯ ВАЛИДАЦИЯ созданного заказа
      console.log("🔍 🔥 CRITICAL VALIDATION of created order data:", {
        order_id: createdOrder.id,
        order_number: createdOrder.order_number,
        title: createdOrder.title,
        price: createdOrder.price,
        delivery_price_confirm: createdOrder.delivery_price_confirm,
        delivery_price_type: typeof createdOrder.delivery_price_confirm,
        order_seller_name: createdOrder.order_seller_name,
        seller_opt_id: createdOrder.seller_opt_id,
        buyer_opt_id: createdOrder.buyer_opt_id,
        brand: createdOrder.brand,
        model: createdOrder.model,
        product_id: createdOrder.product_id,
        delivery_method: createdOrder.delivery_method,
        images_count: createdOrder.images?.length || 0,
        images_actual: createdOrder.images,
        images_comparison: {
          sent_count: combinedImages.length,
          received_count: createdOrder.images?.length || 0,
          match: (combinedImages.length === (createdOrder.images?.length || 0))
        },
        delivery_price_comparison: {
          sent: finalDeliveryPrice,
          received: createdOrder.delivery_price_confirm,
          match: finalDeliveryPrice === createdOrder.delivery_price_confirm
        }
      });

      // Проверяем критически важные поля с детальными ошибками
      const validationErrors = [];
      
      if (!createdOrder.order_seller_name || createdOrder.order_seller_name === 'Unknown Seller') {
        validationErrors.push('Имя продавца не сохранилось');
        console.error("❌ VALIDATION FAILED: seller name not saved");
      }
      
      if (!createdOrder.seller_opt_id) {
        validationErrors.push('OPT_ID продавца не сохранился');
        console.error("❌ VALIDATION FAILED: seller opt_id not saved");
      }
      
      if (!createdOrder.buyer_opt_id) {
        validationErrors.push('OPT_ID покупателя не сохранился');
        console.error("❌ VALIDATION FAILED: buyer opt_id not saved");
      }
      
      // ✅ КРИТИЧЕСКАЯ ПРОВЕРКА: Изображения
      if (!createdOrder.images || createdOrder.images.length === 0) {
        console.error("❌ 🔥 CRITICAL VALIDATION FAILED: No images saved in order!");
        console.error("❌ Images comparison:", {
          expected_images: combinedImages,
          expected_count: combinedImages.length,
          actual_images: createdOrder.images,
          actual_count: createdOrder.images?.length || 0
        });
        validationErrors.push(`Изображения товара не сохранились (отправлено: ${combinedImages.length}, сохранено: ${createdOrder.images?.length || 0})`);
      } else if (createdOrder.images.length !== combinedImages.length) {
        console.warn("⚠️ Images count mismatch:", {
          expected: combinedImages.length,
          actual: createdOrder.images.length,
          expected_images: combinedImages,
          actual_images: createdOrder.images
        });
        validationErrors.push(`Количество изображений не совпадает (отправлено: ${combinedImages.length}, сохранено: ${createdOrder.images.length})`);
      } else {
        console.log("✅ Images successfully saved:", {
          count: createdOrder.images.length,
          images: createdOrder.images
        });
      }

      // ✅ КРИТИЧЕСКАЯ ПРОВЕРКА: Стоимость доставки
      if (finalDeliveryPrice !== null && createdOrder.delivery_price_confirm !== finalDeliveryPrice) {
        console.error("❌ 🔥 CRITICAL VALIDATION FAILED: Delivery price mismatch!", {
          expected: finalDeliveryPrice,
          expected_type: typeof finalDeliveryPrice,
          actual: createdOrder.delivery_price_confirm,
          actual_type: typeof createdOrder.delivery_price_confirm,
          strict_equality: finalDeliveryPrice === createdOrder.delivery_price_confirm,
          loose_equality: finalDeliveryPrice == createdOrder.delivery_price_confirm
        });
        validationErrors.push(`Стоимость доставки не сохранилась корректно (отправлено: ${finalDeliveryPrice}, сохранено: ${createdOrder.delivery_price_confirm})`);
      } else if (finalDeliveryPrice !== null) {
        console.log("✅ Delivery price successfully saved:", {
          sent: finalDeliveryPrice,
          saved: createdOrder.delivery_price_confirm
        });
      }

      // ✅ ПРОВЕРКА: Модель
      if (selectedProduct.model && !createdOrder.model) {
        console.warn("⚠️ Model not saved:", {
          expected: selectedProduct.model,
          actual: createdOrder.model
        });
        validationErrors.push('Модель товара не сохранилась');
      }

      if (validationErrors.length > 0) {
        console.error("❌ 🔥 ORDER VALIDATION FAILED:", validationErrors);
        toast({
          title: "Предупреждение",
          description: `Заказ создан, но есть проблемы: ${validationErrors.join(', ')}`,
          variant: "destructive",
        });
      } else {
        console.log("✅ 🎉 ALL VALIDATIONS PASSED - Order created successfully!");
      }

      // Уведомления будут отправлены автоматически через триггеры базы данных
      console.log("✅ Order created, notifications will be sent via database triggers");

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
