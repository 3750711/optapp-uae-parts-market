
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
      
      // Filter out duplicates that already exist in state
      const uniqueNewUrls = newUrls.filter((url) => !images.includes(url));
      const skipped = newUrls.length - uniqueNewUrls.length;
      if (uniqueNewUrls.length === 0) {
        console.warn("No new images to insert. All URLs already exist for product:", productId, { newUrls });
        toast({
          title: "Нет изменений",
          description: "Новых фотографий не найдено",
        });
        return;
      }

      const imageInserts = uniqueNewUrls.map((url, index) => ({
        product_id: productId,
        url,
        is_primary: images.length === 0 && index === 0 && !primaryImage
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      onImageUpload(uniqueNewUrls);
      
      if (!primaryImage && uniqueNewUrls.length > 0 && onPrimaryImageChange && images.length === 0) {
        console.log("Setting first uploaded image as primary:", uniqueNewUrls[0]);
        onPrimaryImageChange(uniqueNewUrls[0]);
      }
      
      invalidateAllCaches(productId);
      
      toast({
        title: "Успех",
        description: `Добавлено ${uniqueNewUrls.length} фотографий${skipped > 0 ? `, пропущено дубликатов: ${skipped}` : ""}`,
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
