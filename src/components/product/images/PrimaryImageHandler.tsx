
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
      
      // First, reset all images for this product to not primary
      const { error: resetError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      if (resetError) {
        console.error("Error resetting primary status:", resetError);
        throw resetError;
      }
      console.log("Reset all images to non-primary successfully");
      
      // Then set the selected image as primary
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
      
      // Update state in the parent component immediately
      onPrimaryImageChange(imageUrl);
      
      // Unified cache invalidation with optimistic updates
      invalidateAllCaches(productId);
      optimisticUpdateCache(productId, imageUrl);
      
      console.log("Cache invalidated and optimistically updated after primary image change");
      
      toast({
        title: "Успешно",
        description: "Основное фото установлено",
      });
    } catch (error) {
      console.error("Error setting primary image:", error);
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
