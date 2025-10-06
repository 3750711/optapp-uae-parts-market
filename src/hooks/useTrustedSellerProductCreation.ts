import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import { useRoleValidation } from "@/hooks/useRoleValidation";
import { ProductMediaService } from "@/services/ProductMediaService";
import { useTelegramNotification } from "@/hooks/useTelegramNotification";
import { logger } from "@/utils/logger";

interface CreateTrustedProductParams {
  values: AdminProductFormValues;
  imageUrls: string[];
  videoUrls: string[];
  primaryImage?: string;
  brands: Array<{ id: string; name: string }>;
  brandModels: Array<{ id: string; name: string; brand_id: string }>;
}

export const useTrustedSellerProductCreation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const { validateTrustedSeller } = useRoleValidation();
  const { sendProductNotification } = useTelegramNotification();

  const createTrustedSellerProduct = async ({
    values,
    imageUrls,
    videoUrls,
    primaryImage,
    brands,
    brandModels
  }: CreateTrustedProductParams) => {
    if (isCreating) {
      logger.warn("Product creation already in progress");
      return;
    }

    setIsCreating(true);
    logger.log("🚀 Starting trusted seller product creation:", {
      title: values.title,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
    });

    try {
      // Проверяем права доверенного продавца
      validateTrustedSeller();
      
      // Create AbortController with timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000); // 25 second timeout
      
      // Validation
      if (imageUrls.length === 0) {
        throw new Error("Добавьте хотя бы одну фотографию");
      }

      // Get brand and model names
      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      if (!selectedBrand) {
        throw new Error("Не найдена выбранная марка автомобиля");
      }

      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      // Create product using the new trusted seller RPC function
      const { data: productId, error: productError } = await supabase
        .rpc('create_trusted_product', {
          p_title: values.title,
          p_price: Number(values.price),
          p_brand: selectedBrand.name,
          p_description: values.description || null,
          p_condition: "Новый",
          p_model: modelName,
          p_place_number: Number(values.placeNumber) || 1,
          p_delivery_price: Number(values.deliveryPrice) || 0
        })
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (productError) {
        if (productError.name === 'AbortError') {
          throw new Error('Запрос отменен по таймауту');
        }
        logger.error("❌ Error creating trusted seller product:", productError);
        throw new Error(`Ошибка создания товара: ${productError.message}`);
      }

      logger.log("✅ Trusted seller product created with ID:", { productId });

      // Add media using unified service
      await ProductMediaService.addMediaToProduct({
        productId,
        imageUrls,
        videoUrls,
        primaryImage,
        userType: 'trusted_seller'
      });

      // Send notification via new queue system (fire-and-forget)
      sendProductNotification(productId, 'product_published')
        .then(() => {
          logger.log(`✅ Notification queued via send-telegram-notification for trusted seller product ${productId}`);
        })
        .catch(error => {
          logger.error(`⚠️ Failed to queue notification for trusted seller product ${productId}:`, error);
        });

      toast({
        title: "Товар успешно опубликован",
        description: `Ваш товар "${values.title}" активен и доступен для покупателей.`,
      });

      logger.log("✅ Trusted seller product creation completed successfully:", { productId });
      return { productId, status: 'active' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      logger.error("💥 Error in trusted seller product creation:", error);
      
      toast({
        title: "Ошибка создания товара",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createTrustedSellerProduct,
    isCreating
  };
};