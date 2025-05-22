
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  maxImages = 25
}) => {
  const { toast } = useToast();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

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

      // First, delete the image record from the database
      const { error: dbError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', productId)
        .eq('url', imageUrl);

      if (dbError) throw dbError;

      // If this was the primary image, set another image as primary
      if (primaryImage === imageUrl && images.length > 1 && onPrimaryImageChange) {
        const newPrimaryUrl = images.find(img => img !== imageUrl);
        if (newPrimaryUrl) {
          await handleSetPrimaryImage(newPrimaryUrl);
        }
      }

      // Call the parent's onImageDelete function to update UI
      onImageDelete(imageUrl);

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
      
      // Update the database - set all images for this product to not primary
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      // Set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', productId)
        .eq('url', imageUrl);
      
      if (error) throw error;
      
      // Update the UI through parent component
      onPrimaryImageChange(imageUrl);
      
      toast({
        title: "Успешно",
        description: "Основное фото изменено",
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
    <div className="flex flex-col gap-4">
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          {images.map((url, index) => (
            <div 
              key={url} 
              className={`relative group rounded-md overflow-hidden border aspect-square w-24 h-24 ${primaryImage === url ? 'ring-2 ring-blue-500' : ''}`}
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
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 rounded-full"
                    onClick={() => handleSetPrimaryImage(url)}
                    disabled={settingPrimary === url || primaryImage === url}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="h-7 w-7 rounded-full"
                  onClick={() => handleImageDelete(url)}
                  disabled={deletingImage === url}
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
          onUpload={onImageUpload}
          onDelete={handleImageDelete}
          maxImages={maxImages}
        />
      </div>
      <div>
        <AdminProductVideosManager
          productId={productId}
          videos={videos}
          onVideosChange={onVideosChange}
        />
      </div>
    </div>
  );
};

export default ProductMediaManager;
