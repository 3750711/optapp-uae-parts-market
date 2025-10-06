import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useTelegramNotification } from "@/hooks/useTelegramNotification";
import { useProductCreationMonitoring } from "@/hooks/useProductCreationMonitoring";
import { ProductMediaService } from "@/services/ProductMediaService";
import { logger } from "@/utils/logger";

interface CreateProductParams {
  values: AdminProductFormValues;
  imageUrls: string[];
  videoUrls: string[];
  primaryImage?: string;
  sellers: Array<{ id: string; full_name: string; opt_id?: string }>;
  brands: Array<{ id: string; name: string }>;
  brandModels: Array<{ id: string; name: string; brand_id: string }>;
}

export const useAdminProductCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const { notifyAdminsNewProduct } = useAdminNotifications();
  const { sendProductNotification } = useTelegramNotification();
  const monitoring = useProductCreationMonitoring({
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  });

  // Validation helper function
  const validateProductData = async (
    values: AdminProductFormValues,
    imageUrls: string[],
    sellers: Array<{ id: string; full_name: string; opt_id?: string }>,
    brands: Array<{ id: string; name: string }>,
    brandModels: Array<{ id: string; name: string; brand_id: string }>
  ) => {
    if (imageUrls.length === 0) {
      throw new Error("Добавьте хотя бы одну фотографию");
    }

    const selectedBrand = brands.find(brand => brand.id === values.brandId);
    const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
    
    if (!selectedBrand) throw new Error("Не найдена выбранная марка автомобиля");
    if (!selectedSeller) throw new Error("Не найден выбранный продавец");

    let modelName = null;
    if (values.modelId) {
      const selectedModel = brandModels.find(model => model.id === values.modelId);
      modelName = selectedModel?.name || null;
    }

    return { selectedBrand, selectedSeller, modelName };
  };

  // Network operation with exponential backoff
  const executeWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Network operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms:`, { error: lastError.message });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  };

  const createProductWithTransaction = async ({
    values,
    imageUrls,
    videoUrls,
    primaryImage,
    sellers,
    brands,
    brandModels
  }: CreateProductParams) => {
    if (isCreating) {
      console.warn("Product creation already in progress");
      return;
    }

    setIsCreating(true);
    let productId: string | null = null;
    
    // Initialize progress monitoring
    monitoring.initializeSteps([
      { id: 'validate', label: 'Проверка данных' },
      { id: 'create', label: 'Создание товара' },
      { id: 'images', label: 'Загрузка изображений' },
      { id: 'videos', label: 'Загрузка видео' },
      { id: 'telegram', label: 'Отправка уведомлений' },
      { id: 'cloudinary', label: 'Обработка медиа' },
      { id: 'background', label: 'Фоновые задачи' }
    ]);
    
    console.log("🚀 Starting admin product creation transaction:", {
      title: values.title,
      sellerId: values.sellerId,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
    });

    try {
      // Step 1: Validate data
      const { selectedBrand, selectedSeller, modelName } = await monitoring.executeStep('validate', async () => {
        return await validateProductData(values, imageUrls, sellers, brands, brandModels);
      });

      // Step 2: Create product
      const product = await monitoring.executeStep('create', async () => {
        const { data: createdProductId, error: productError } = await supabase.rpc('admin_create_product', {
          p_title: values.title,
          p_price: Number(values.price),
          p_condition: "Новый",
          p_brand: selectedBrand.name,
          p_model: modelName,
          p_description: values.description || null,
          p_seller_id: values.sellerId,
          p_seller_name: selectedSeller.full_name,
          p_status: 'active', // Администраторские товары сразу активны
          p_place_number: Number(values.placeNumber) || 1,
          p_delivery_price: Number(values.deliveryPrice) || 0,
        });

        if (productError) {
          throw new Error(`Ошибка создания товара: ${productError.message}`);
        }
        
        productId = createdProductId;
        console.log("✅ Product created successfully with admin RPC:", productId);

        // Получаем созданный товар для дальнейшей работы
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select()
          .eq('id', productId)
          .single();

        if (fetchError) {
          throw new Error(`Ошибка получения созданного товара: ${fetchError.message}`);
        }

        return product;
      });

      // Step 3: Add media using unified service
      await monitoring.executeStep('images', async () => {
        await ProductMediaService.addMediaToProduct({
          productId,
          imageUrls,
          videoUrls,
          primaryImage,
          userType: 'admin'
        });
      });

      // Step 5: Queue Telegram notification (fire-and-forget)
      monitoring.executeStep('telegram', async () => {
        // Send notification in background without blocking
        supabase.functions.invoke('send-tg-product-once', {
          body: { productId }
        }).then(() => {
          console.log(`✅ Telegram notification queued for product ${productId}`);
        }).catch(error => {
          console.error(`⚠️ Failed to queue Telegram notification for product ${productId}:`, error);
        });
        
        console.log(`📨 Telegram notification being sent in background for product ${productId}`);
      }).catch(error => {
        console.error("⚠️ Telegram notification queueing failed (non-critical):", error);
        monitoring.updateStep('telegram', { status: 'completed', error: 'Non-critical error' });
      });

      // Step 6: Update Cloudinary data (non-critical)
      await monitoring.executeStep('cloudinary', async () => {
        if (primaryImage) {
          const publicId = extractPublicIdFromUrl(primaryImage);
          if (publicId) {
            await supabase.from('products').update({
                cloudinary_public_id: publicId,
                cloudinary_url: primaryImage
            }).eq('id', product.id);
          }
        }
        console.log("✅ Cloudinary data updated");
      }).catch(error => {
        console.error("⚠️ Cloudinary processing error (non-critical):", error);
        monitoring.updateStep('cloudinary', { status: 'completed', error: 'Non-critical error' });
      });

      // Step 7: Start background tasks (AI embeddings and synonyms)
      monitoring.executeStep('background', async () => {
        // Start background processing - don't await this
        supabase.functions.invoke('process-product-background', {
          body: {
            productId: product.id,
            title: values.title,
            brand: selectedBrand.name,
            model: modelName,
            tasks: ['embeddings', 'synonyms']
          }
        }).then(() => {
          console.log(`✅ Background tasks queued for product ${productId}`);
        }).catch(error => {
          console.error("⚠️ Background tasks failed (non-critical):", error);
        });

        // Also send admin notifications in background with backoff
        executeWithBackoff(async () => {
          await notifyAdminsNewProduct(product.id);
        }, 2, 1500).catch(error => {
          console.error("⚠️ Admin notification failed (non-critical):", error);
        });

        console.log("✅ Background tasks initiated");
      }).catch(error => {
        console.error("⚠️ Background tasks failed (non-critical):", error);
        monitoring.updateStep('background', { status: 'completed', error: 'Non-critical error' });
      });

      toast({
        title: "Товар успешно создан",
        description: `Товар для продавца ${selectedSeller.full_name} опубликован. Уведомление отправляется в фоне.`,
      });

      console.log("✅ Product creation transaction completed successfully:", { productId });
      return product;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      console.error("💥 Critical error in product creation transaction:", error);

      // --- Логика отката ---
      if (productId) {
        console.log(`🔄 Rolling back transaction for product ID: ${productId}`);
        // В будущем здесь можно добавить и удаление файлов из storage
        await supabase.from('products').delete().eq('id', productId);
        console.log(`✅ Rollback complete. Product ${productId} deleted.`);
        toast({
          title: "Транзакция отменена",
          description: "Не удалось создать товар, все изменения были отменены.",
          variant: "destructive",
        });
      }
      
      toast({
        title: "Ошибка создания товара",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Пробрасываем ошибку дальше для обработки в UI
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProductWithTransaction,
    isCreating,
    steps: monitoring.steps,
    totalProgress: monitoring.totalProgress,
    resetMonitoring: monitoring.reset
  };
};
