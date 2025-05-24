
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageCacheManager } from "./ImageCacheManager";

interface UseImageDeletionProps {
  productId: string;
  images: string[];
  primaryImage?: string;
  onImageDelete: (urlToDelete: string) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
}

export const useImageDeletion = ({
  productId,
  images,
  primaryImage,
  onImageDelete,
  onPrimaryImageChange
}: UseImageDeletionProps) => {
  const { toast } = useToast();
  const { invalidateAllCaches, optimisticRemoveImage } = useImageCacheManager();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const handleImageDelete = async (imageUrl: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingImage(imageUrl);
      console.log("Deleting image:", imageUrl);

      // Optimistic update - remove image from cache immediately
      optimisticRemoveImage(productId, imageUrl);

      // First, delete the image record from the database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
        .eq('url', imageUrl);

      if (dbError) throw dbError;
      console.log("Successfully deleted from database");

      // Call the parent's onImageDelete function to update UI
      onImageDelete(imageUrl);
      
      // If this was the primary image, set another image as primary
      if (primaryImage === imageUrl && images.length > 1 && onPrimaryImageChange) {
        const newPrimaryUrl = images.find(img => img !== imageUrl);
        if (newPrimaryUrl) {
          console.log("Primary image deleted, setting new primary:", newPrimaryUrl);
          onPrimaryImageChange(newPrimaryUrl);
        }
      }
      
      // Final cache invalidation to ensure consistency
      invalidateAllCaches(productId);

      toast({
        title: "Успешно",
        description: "Фотография удалена",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      
      // Revert optimistic update on error
      invalidateAllCaches(productId);
      
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    } finally {
      setDeletingImage(null);
    }
  };

  return {
    handleImageDelete,
    deletingImage
  };
};
