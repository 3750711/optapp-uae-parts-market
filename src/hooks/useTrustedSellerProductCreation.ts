import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductFormValues } from "@/schemas/adminProductSchema";

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

  const createTrustedSellerProduct = async ({
    values,
    imageUrls,
    videoUrls,
    primaryImage,
    brands,
    brandModels
  }: CreateTrustedProductParams) => {
    if (isCreating) {
      console.warn("Product creation already in progress");
      return;
    }

    setIsCreating(true);
    console.log("🚀 Starting trusted seller product creation:", {
      title: values.title,
      imageCount: imageUrls.length,
      videoCount: videoUrls.length,
    });

    try {
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

      // Create product using the enhanced RPC function
      const { data: productId, error: productError } = await supabase
        .rpc('create_product_with_images', {
          p_title: values.title,
          p_price: Number(values.price),
          p_description: values.description || null,
          p_condition: "Новый",
          p_brand: selectedBrand.name,
          p_model: modelName,
          p_place_number: Number(values.placeNumber) || 1,
          p_delivery_price: Number(values.deliveryPrice) || 0
        });

      if (productError) {
        console.error("❌ Error creating trusted seller product:", productError);
        throw new Error(`Ошибка создания товара: ${productError.message}`);
      }

      console.log("✅ Trusted seller product created with ID:", productId);

      // Add images
      const imageInserts = imageUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: url === primaryImage
      }));
      
      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);
        
      if (imageError) {
        console.error('❌ Error adding images:', imageError);
        throw new Error(`Ошибка добавления изображений: ${imageError.message}`);
      }

      console.log(`✅ ${imageUrls.length} images added for trusted seller product ${productId}`);

      // Add videos if any
      if (videoUrls.length > 0) {
        const videoInserts = videoUrls.map(url => ({
          product_id: productId,
          url: url
        }));
        
        const { error: videoError } = await supabase
          .from('product_videos')
          .insert(videoInserts);
          
        if (videoError) {
          console.error('❌ Error adding videos:', videoError);
          throw new Error(`Ошибка добавления видео: ${videoError.message}`);
        }

        console.log(`✅ ${videoUrls.length} videos added for trusted seller product ${productId}`);
      }

      // Send background notifications (fire-and-forget)
      supabase.functions.invoke('send-tg-product-once', {
        body: { productId }
      }).then(() => {
        console.log(`✅ Telegram notification queued for trusted seller product ${productId}`);
      }).catch(error => {
        console.error(`⚠️ Failed to queue Telegram notification for trusted seller product ${productId}:`, error);
      });

      toast({
        title: "Товар успешно опубликован",
        description: `Ваш товар "${values.title}" активен и доступен для покупателей.`,
      });

      console.log("✅ Trusted seller product creation completed successfully:", { productId });
      return { productId, status: 'active' };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Неизвестная ошибка";
      console.error("💥 Error in trusted seller product creation:", error);
      
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