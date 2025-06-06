
import { useToast } from "@/hooks/use-toast";
import { useImageCacheManager } from "../images/ImageCacheManager";
import { usePreviewImageSync } from "@/hooks/usePreviewImageSync";

interface UseProductImageHandlersProps {
  productId: string;
  images: string[];
  primaryImage: string;
  setImages: (images: string[]) => void;
  setPrimaryImage: (primaryImage: string) => void;
}

export const useProductImageHandlers = ({
  productId,
  images,
  primaryImage,
  setImages,
  setPrimaryImage
}: UseProductImageHandlersProps) => {
  const { toast } = useToast();
  const { invalidateAllCaches, optimisticUpdateCache } = useImageCacheManager();
  
  // Initialize preview sync hook
  const { syncPreviewImage } = usePreviewImageSync({
    productId,
    onSyncComplete: (previewUrl) => {
      console.log('🎯 Preview sync completed in ProductImageHandlers:', previewUrl);
      // Invalidate cache after successful sync
      invalidateAllCaches(productId);
    }
  });

  const handleImageUpload = (newUrls: string[]) => {
    console.log("ProductImageHandlers - handleImageUpload called with:", newUrls);
    const updatedImages = [...images, ...newUrls];
    setImages(updatedImages);
    
    if (primaryImage === '' && newUrls.length > 0) {
      console.log("ProductImageHandlers - Setting first uploaded image as primary:", newUrls[0]);
      setPrimaryImage(newUrls[0]);
      // 🔄 NEW: Sync preview when setting first image as primary
      syncPreviewImage(newUrls[0]);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    console.log("ProductImageHandlers - handleImageDelete called with:", urlToDelete);
    const updatedImages = images.filter(url => url !== urlToDelete);
    setImages(updatedImages);
    
    if (primaryImage === urlToDelete && updatedImages.length > 0) {
      console.log("ProductImageHandlers - Primary image deleted, setting new primary:", updatedImages[0]);
      setPrimaryImage(updatedImages[0]);
      // 🔄 NEW: Sync preview when setting new primary after deletion
      syncPreviewImage(updatedImages[0]);
    } else if (updatedImages.length === 0) {
      setPrimaryImage('');
    }
  };

  const handlePrimaryImageChange = async (imageUrl: string) => {
    console.log("ProductImageHandlers - handlePrimaryImageChange called with:", imageUrl);
    setPrimaryImage(imageUrl);
    
    // Optimistic update first for immediate UI response
    optimisticUpdateCache(productId, imageUrl);
    
    // 🔄 NEW: Automatically sync preview image when primary changes
    await syncPreviewImage(imageUrl);
    
    // Then invalidate to ensure fresh data
    invalidateAllCaches(productId);
    
    toast({
      title: "Обновлено",
      description: "Основное фото изменено и превью обновлено",
    });
  };

  return {
    handleImageUpload,
    handleImageDelete,
    handlePrimaryImageChange
  };
};
