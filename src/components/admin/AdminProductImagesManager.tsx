
// Assuming this component is similar to ProductMediaManager
// but without implementation details provided, we need to update its prop types
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
        onPrimaryImageChange(newUrls[0]);
      }
      
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

      // Delete the image record from the database
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
          onPrimaryImageChange(newPrimaryUrl);
        }
      }

      // Update UI
      const updatedImages = images.filter(url => url !== urlToDelete);
      onImagesChange(updatedImages);

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

  // Set primary image
  const handleSetPrimaryImage = async (imageUrl: string) => {
    if (!onPrimaryImageChange) return;
    
    try {
      setSettingPrimary(imageUrl);
      onPrimaryImageChange(imageUrl);
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
                  <Check className="h-4 w-4" />
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
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
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
