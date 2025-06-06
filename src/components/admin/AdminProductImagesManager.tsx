
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { usePreviewImageSync } from "@/hooks/usePreviewImageSync";

export interface AdminProductImagesManagerProps {
  productId: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  primaryImage?: string;
  onPrimaryImageChange?: (imageUrl: string) => void;
}

export const AdminProductImagesManager = ({
  productId,
  images,
  onImagesChange,
  primaryImage,
  onPrimaryImageChange,
}: AdminProductImagesManagerProps) => {
  const { toast } = useToast();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Initialize preview sync hook
  const { syncPreviewImage } = usePreviewImageSync({
    productId,
    onSyncComplete: (previewUrl) => {
      console.log('🎯 Admin preview sync completed:', previewUrl);
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    }
  });

  // Handle image upload
  const handleImageUpload = async (newUrls: string[]) => {
    try {
      const imageInserts = newUrls.map(url => ({
        product_id: productId,
        url: url,
        is_primary: images.length === 0 && !primaryImage // First image is primary if no images exist
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      const updatedImages = [...images, ...newUrls];
      onImagesChange(updatedImages);
      
      // If no primary image is set, set the first new image as primary
      if (!primaryImage && newUrls.length > 0 && onPrimaryImageChange) {
        await handleSetPrimaryImage(newUrls[0]);
      }
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      
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

  // Handle image deletion
  const handleImageDelete = async (urlToDelete: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive",
      });
      return;
    }

    try {
      setDeletingImage(urlToDelete);

      // First delete the image record from the database
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
        .eq('url', urlToDelete);

      if (error) throw error;

      // If this was the primary image, set another image as primary
      if (primaryImage === urlToDelete && images.length > 1 && onPrimaryImageChange) {
        const newPrimaryUrl = images.find(img => img !== urlToDelete);
        if (newPrimaryUrl) {
          await handleSetPrimaryImage(newPrimaryUrl);
        }
      }

      // Update UI after successful DB operation
      const updatedImages = images.filter(url => url !== urlToDelete);
      onImagesChange(updatedImages);
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });

      toast({
        title: "Успех",
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

  // Set primary image with preview sync
  const handleSetPrimaryImage = async (imageUrl: string) => {
    if (!onPrimaryImageChange) return;
    
    try {
      setSettingPrimary(imageUrl);
      console.log('🔄 Admin setting primary image:', imageUrl, 'for product:', productId);
      
      // First reset all images for this product to not primary
      const { error: resetError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      if (resetError) throw resetError;
      
      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', productId)
        .eq('url', imageUrl);
      
      if (error) throw error;
      
      console.log('✅ Database updated, now syncing preview...');
      
      // Update parent state immediately
      onPrimaryImageChange(imageUrl);
      
      // 🔄 Sync preview image after database update
      await syncPreviewImage(imageUrl);
      
      // Force invalidate cache after sync
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      
      toast({
        title: "Успех",
        description: "Основное фото обновлено и превью синхронизировано",
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

  return (
    <div className="space-y-4">
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
        onUpload={handleImageUpload}
        onDelete={handleImageDelete}
        maxImages={25}
      />
    </div>
  );
};
