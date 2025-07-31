import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";
import { extractPublicIdFromUrl } from "@/utils/cloudinaryUtils";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";

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

      // 1. Создаем товар
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
          status: 'pending',
          place_number: Number(values.placeNumber) || 1,
          delivery_price: Number(values.deliveryPrice) || 0,
        })
        .select()
        .single();

      if (productError) {
        throw new Error(`Ошибка создания товара: ${productError.message}`);
      }
      productId = product.id;
      console.log("✅ Product created successfully:", productId);

      // 2. Добавляем изображения (одной операцией)
      const imageInserts = imageUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: url === primaryImage
      }));
      const { error: imageError } = await supabase.from('product_images').insert(imageInserts);
      if (imageError) {
        throw new Error(`Ошибка добавления изображений: ${imageError.message}`);
      }
      console.log(`✅ ${imageUrls.length} images inserted for product ${productId}`);


      // 3. Обновляем товар с Cloudinary данными (некритично, без отката)
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

      // 4. Добавляем видео (одной операцией)
      if (videoUrls.length > 0) {
        const videoInserts = videoUrls.map(videoUrl => ({
          product_id: productId,
          url: videoUrl
        }));
        const { error: videoError } = await supabase.from('product_videos').insert(videoInserts);
        if (videoError) {
          throw new Error(`Ошибка добавления видео: ${videoError.message}`);
        }
        console.log(`✅ ${videoUrls.length} videos inserted for product ${productId}`);
      }

      // 5. Отправляем уведомления администраторам о новом товаре на модерацию
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
