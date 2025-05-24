
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useImageCacheManager } from "./ImageCacheManager";

interface UsePrimaryImageProps {
  productId: string;
  onPrimaryImageChange?: (imageUrl: string) => void;
}

export const usePrimaryImage = ({
  productId,
  onPrimaryImageChange
}: UsePrimaryImageProps) => {
  const { toast } = useToast();
  const { invalidateAllCaches, optimisticUpdateCache } = useImageCacheManager();
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const handleSetPrimaryImage = async (imageUrl: string) => {
    if (!onPrimaryImageChange) {
      console.log("onPrimaryImageChange not provided");
      return;
    }
    
    try {
      setSettingPrimary(imageUrl);
      console.log("Setting primary image:", imageUrl);
      
      // Optimistic update first for immediate UI response
      optimisticUpdateCache(productId, imageUrl);
      
      // Update local state immediately
      onPrimaryImageChange(imageUrl);
      
      // Reset all images for this product to not primary
      const { error: resetError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      if (resetError) {
        console.error("Error resetting primary status:", resetError);
        throw resetError;
      }
      
      // Set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', productId)
        .eq('url', imageUrl);
      
      if (error) {
        console.error("Error setting image as primary:", error);
        throw error;
      }
      
      console.log("Database updated successfully for primary image");
      
      // Final cache invalidation to ensure consistency
      invalidateAllCaches(productId);
      
      toast({
        title: "Обновлено",
        description: "Основное фото изменено",
      });
    } catch (error) {
      console.error("Error setting primary image:", error);
      
      // Revert optimistic update on error
      invalidateAllCaches(productId);
      
      toast({
        title: "Ошибка",
        description: "Не удалось установить основное фото",
        variant: "destructive",
      });
    } finally {
      setSettingPrimary(null);
    }
  };

  return {
    handleSetPrimaryImage,
    settingPrimary
  };
};
