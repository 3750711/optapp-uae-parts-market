import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useTelegramNotification } from "@/hooks/useTelegramNotification";
import { useAISearch } from "@/hooks/useAISearch";

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
  const { generateEmbeddingForProduct } = useAISearch();

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
    
    console.log("🚀 Starting admin product creation transaction:", {
      title: values.title,
      sellerId: values.sellerId,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
    });

    try {
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

      // --- Транзакция начинается ---

      // 1. Создаем товар через admin RPC функцию
      const { data: createdProductId, error: productError } = await supabase.rpc('admin_create_product', {
        p_title: values.title,
        p_price: Number(values.price),
        p_condition: "Новый",
        p_brand: selectedBrand.name,
        p_model: modelName,
        p_description: values.description || null,
        p_seller_id: values.sellerId,
        p_seller_name: selectedSeller.full_name,
        p_status: 'pending', // Будет автоматически изменен на 'active' триггером для админов
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

      // 2. Добавляем изображения через admin RPC функцию
      for (const url of imageUrls) {
        const { error: imageError } = await supabase.rpc('admin_insert_product_image', {
          p_product_id: productId,
          p_url: url,
          p_is_primary: url === primaryImage
        });
        if (imageError) {
          throw new Error(`Ошибка добавления изображения: ${imageError.message}`);
        }
      }
      console.log(`✅ ${imageUrls.length} images inserted for product ${productId}`);

      // 3. Отправляем Telegram уведомление о публикации товара
      try {
        await sendProductNotification(productId, 'product_published');
        console.log(`✅ Telegram notification sent for published product ${productId}`);
      } catch (telegramError) {
        console.error("⚠️ Telegram notification failed (non-critical):", telegramError);
      }

      // 4. Обновляем товар с Cloudinary данными (некритично, без отката)
      if (primaryImage) {
        try {
          const publicId = extractPublicIdFromUrl(primaryImage);
          if (publicId) {
            await supabase.from('products').update({
                cloudinary_public_id: publicId,
                cloudinary_url: primaryImage
            }).eq('id', product.id);
          }
        } catch (cloudinaryError) {
          console.error("⚠️ Cloudinary processing error (non-critical):", cloudinaryError);
        }
      }

      // 5. Добавляем видео через admin RPC функцию
      if (videoUrls.length > 0) {
        for (const videoUrl of videoUrls) {
          const { error: videoError } = await supabase.rpc('admin_insert_product_video', {
            p_product_id: productId,
            p_url: videoUrl
          });
          if (videoError) {
            throw new Error(`Ошибка добавления видео: ${videoError.message}`);
          }
        }
        console.log(`✅ ${videoUrls.length} videos inserted for product ${productId}`);
      }

      // 6. Генерируем embedding для нового товара (некритично)
      try {
        console.log(`🔍 Generating embedding for new product ${productId}`);
        const embeddingResult = await generateEmbeddingForProduct(productId);
        if (embeddingResult.success) {
          console.log(`✅ Embedding generated successfully for product ${productId}`);
        } else {
          console.warn(`⚠️ Embedding generation failed for product ${productId}:`, embeddingResult.error);
        }
      } catch (embeddingError) {
        console.error("⚠️ Embedding generation failed (non-critical):", embeddingError);
      }

      // 7. Отправляем уведомления администраторам о новом товаре на модерацию
      try {
        await notifyAdminsNewProduct(product.id);
      } catch (adminNotificationError) {
        console.error("⚠️ Admin notification failed (non-critical):", adminNotificationError);
      }

      toast({
        title: "Товар успешно создан",
        description: `Товар для продавца ${selectedSeller.full_name} опубликован.`,
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
    isCreating
  };
};
