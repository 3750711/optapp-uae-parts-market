
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageCacheManager } from "./ImageCacheManager";

interface UseImageUploadProps {
  productId: string;
  images: string[];
  primaryImage?: string;
  onImageUpload: (newUrls: string[]) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
}

export const useImageUpload = ({
  productId,
  images,
  primaryImage,
  onImageUpload,
  onPrimaryImageChange
}: UseImageUploadProps) => {
  const { toast } = useToast();
  const { invalidateAllCaches } = useImageCacheManager();

  const handleImageUpload = async (newUrls: string[]) => {
    try {
      console.log("Uploading new images:", newUrls);
      
      const imageInserts = newUrls.map((url, index) => ({
        product_id: productId,
        url: url,
        is_primary: images.length === 0 && index === 0 && !primaryImage
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      onImageUpload(newUrls);
      
      if (!primaryImage && newUrls.length > 0 && onPrimaryImageChange && images.length === 0) {
        console.log("Setting first uploaded image as primary:", newUrls[0]);
        onPrimaryImageChange(newUrls[0]);
      }
      
      invalidateAllCaches(productId);
      
      toast({
        title: "Успех",
        description: `Добавлено ${newUrls.length} фотографий`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить фотографии",
        variant: "destructive",
      });
    }
  };

  return {
    handleImageUpload
  };
};
