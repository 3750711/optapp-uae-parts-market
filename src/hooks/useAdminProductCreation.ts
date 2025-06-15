
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";

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
    
    // Детальное логирование начала процесса
    console.log("🚀 Starting admin product creation:", {
      title: values.title,
      sellerId: values.sellerId,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
      timestamp: new Date().toISOString()
    });

    try {
      // Валидация данных перед созданием
      if (imageUrls.length === 0) {
        throw new Error("Добавьте хотя бы одну фотографию");
      }

      const selectedBrand = brands.find(brand => brand.id === values.brandId);
      const selectedSeller = sellers.find(seller => seller.id === values.sellerId);
      
      if (!selectedBrand) {
        throw new Error("Не найдена выбранная марка автомобиля");
      }

      if (!selectedSeller) {
        throw new Error("Не найден выбранный продавец");
      }

      let modelName = null;
      if (values.modelId) {
        const selectedModel = brandModels.find(model => model.id === values.modelId);
        modelName = selectedModel?.name || null;
      }

      // Начинаем транзакцию
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          title: values.title,
          price: Number(values.price),
          condition: "Новый",
          brand: selectedBrand.name,
          model: modelName,
          description: values.description || null,
          seller_id: values.sellerId,
          seller_name: selectedSeller.full_name,
          status: 'active',
          place_number: Number(values.placeNumber) || 1,
          delivery_price: Number(values.deliveryPrice) || 0,
        })
        .select()
        .single();

      if (productError) {
        console.error("❌ Product creation failed:", productError);
        throw new Error(`Ошибка создания товара: ${productError.message}`);
      }

      console.log("✅ Product created successfully:", product.id);

      // Добавляем изображения
      const imageErrors: string[] = [];
      for (const url of imageUrls) {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert({
            product_id: product.id,
            url: url,
            is_primary: url === primaryImage
          });
          
        if (imageError) {
          console.error("❌ Image insert failed:", imageError);
          imageErrors.push(`Изображение ${url}: ${imageError.message}`);
        }
      }

      // Обновляем товар с Cloudinary данными если есть primary image
      if (primaryImage) {
        try {
          const publicId = extractPublicIdFromUrl(primaryImage);
          if (publicId) {
            const { error: updateError } = await supabase
              .from('products')
              .update({
                cloudinary_public_id: publicId,
                cloudinary_url: primaryImage
              })
              .eq('id', product.id);

            if (updateError) {
              console.error("⚠️ Cloudinary data update failed:", updateError);
              // Не прерываем процесс, это не критическая ошибка
            }
          }
        } catch (cloudinaryError) {
          console.error("⚠️ Cloudinary processing error:", cloudinaryError);
          // Не прерываем процесс
        }
      }

      // Добавляем видео если есть
      const videoErrors: string[] = [];
      for (const videoUrl of videoUrls) {
        const { error: videoError } = await supabase
          .from('product_videos')
          .insert({
            product_id: product.id,
            url: videoUrl
          });
          
        if (videoError) {
          console.error("❌ Video insert failed:", videoError);
          videoErrors.push(`Видео ${videoUrl}: ${videoError.message}`);
        }
      }

      // Отправляем уведомление (не критично, если не сработает)
      try {
        await supabase.functions.invoke('send-telegram-notification', {
          body: { productId: product.id }
        });
      } catch (notificationError) {
        console.error("⚠️ Notification failed:", notificationError);
        // Не прерываем процесс
      }

      // Формируем финальное сообщение
      let successMessage = `Товар успешно создан для продавца ${selectedSeller.full_name}`;
      
      if (imageErrors.length > 0) {
        successMessage += `\n⚠️ Некоторые изображения не загружены: ${imageErrors.length} из ${imageUrls.length}`;
      }
      
      if (videoErrors.length > 0) {
        successMessage += `\n⚠️ Некоторые видео не загружены: ${videoErrors.length} из ${videoUrls.length}`;
      }

      toast({
        title: "Товар создан",
        description: successMessage,
      });

      console.log("✅ Product creation completed successfully:", {
        productId: product.id,
        imageErrors: imageErrors.length,
        videoErrors: videoErrors.length
      });

      return product;

    } catch (error) {
      console.error("💥 Critical error in product creation:", error);
      
      toast({
        title: "Ошибка создания товара",
        description: error instanceof Error ? error.message : "Неизвестная ошибка. Попробуйте позже.",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createProductWithTransaction,
    isCreating
  };
};
