
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
      
      const imageInserts = newUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: images.length === 0 && !primaryImage // First image is primary if no images exist
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      // Call the parent's onImageUpload function to update UI
      onImageUpload(newUrls);
      
      // If no primary image is set, set the first new image as primary
      if (!primaryImage && newUrls.length > 0 && onPrimaryImageChange) {
        onPrimaryImageChange(newUrls[0]);
      }
      
      // Unified cache invalidation
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
