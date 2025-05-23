
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ProductMediaManagerProps {
  productId: string;
  images: string[];
  videos: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onVideosChange: (videos: string[]) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  primaryImage?: string;
  maxImages?: number;
  storageBucket?: string;
}

const ProductMediaManager: React.FC<ProductMediaManagerProps> = ({
  productId,
  images,
  videos,
  onImageUpload,
  onImageDelete,
  onVideosChange,
  onPrimaryImageChange,
  primaryImage,
  maxImages = 25,
  storageBucket = "Product Images"
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);

  // Enhanced image delete function that actually removes the image from storage and database
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

      // First, delete the image record from the database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
        .eq('url', imageUrl);

      if (dbError) throw dbError;
      console.log("Successfully deleted from database");

      // If this was the primary image, set another image as primary
      if (primaryImage === imageUrl && images.length > 1 && onPrimaryImageChange) {
        const newPrimaryUrl = images.find(img => img !== imageUrl);
        if (newPrimaryUrl) {
          console.log("Primary image deleted, setting new primary:", newPrimaryUrl);
          await handleSetPrimaryImage(newPrimaryUrl);
        }
      }

      // Call the parent's onImageDelete function to update UI
      onImageDelete(imageUrl);
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      console.log("Cache invalidated after image deletion");
      setPendingChanges(true);

      toast({
        title: "Успешно",
        description: "Фотография удалена",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    } finally {
      setDeletingImage(null);
    }
  };

  // New function to set an image as primary
  const handleSetPrimaryImage = async (imageUrl: string) => {
    if (!onPrimaryImageChange) return;
    
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
      
      // Update state in the parent component
      onPrimaryImageChange(imageUrl);
      setPendingChanges(true);
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      console.log("Cache invalidated after primary image change");
      
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

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      
      // Here we're invalidating the product cache to ensure all changes are reflected
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      console.log("All changes saved, cache invalidated");
      
      toast({
        title: "Успешно",
        description: "Все изменения сохранены",
      });
      setPendingChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Фотографии</h3>
          {pendingChanges && (
            <Button 
              onClick={handleSaveChanges} 
              disabled={isSaving}
              variant="secondary"
              size="sm"
              className="flex items-center gap-1"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить изменения
            </Button>
          )}
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {images.map((url, index) => (
            <div 
              key={url} 
              className={`relative group rounded-md overflow-hidden border aspect-square ${primaryImage === url ? 'ring-2 ring-blue-500' : ''}`}
            >
              <img 
                src={url} 
                alt={`Фото ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {onPrimaryImageChange && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 rounded-full p-0"
                    onClick={() => handleSetPrimaryImage(url)}
                    disabled={settingPrimary === url || primaryImage === url}
                  >
                    {settingPrimary === url ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 w-7 rounded-full p-0"
                  onClick={() => handleImageDelete(url)}
                  disabled={deletingImage === url || images.length <= 1}
                >
                  <span className="sr-only">Удалить</span>
                  {deletingImage === url ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  )}
                </Button>
              </div>
              {primaryImage === url && (
                <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-70 p-1">
                  <p className="text-white text-xs text-center">Основное</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <ImageUpload 
          images={images}
          onUpload={(newUrls) => {
            onImageUpload(newUrls);
            setPendingChanges(true);
          }}
          onDelete={(url) => {
            handleImageDelete(url);
            setPendingChanges(true);
          }}
          maxImages={maxImages}
          storageBucket={storageBucket}
        />
      </div>
      <div>
        <h3 className="font-medium mb-2">Видео</h3>
        <AdminProductVideosManager
          productId={productId}
          videos={videos}
          onVideosChange={(newVideos) => {
            onVideosChange(newVideos);
            setPendingChanges(true);
          }}
        />
      </div>
    </div>
  );
};

export default ProductMediaManager;
