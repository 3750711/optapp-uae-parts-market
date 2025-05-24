
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface UnifiedProductImagesManagerProps {
  productId: string;
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  primaryImage?: string;
  maxImages?: number;
  storageBucket?: string;
  showUpload?: boolean;
}

export const UnifiedProductImagesManager: React.FC<UnifiedProductImagesManagerProps> = ({
  productId,
  images,
  onImageUpload,
  onImageDelete,
  onPrimaryImageChange,
  primaryImage,
  maxImages = 25,
  storageBucket = "Product Images",
  showUpload = true
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  console.log("UnifiedProductImagesManager rendered with:", {
    productId,
    imagesCount: images.length,
    primaryImage,
    onPrimaryImageChange: !!onPrimaryImageChange
  });

  // Unified cache invalidation function
  const invalidateAllCaches = () => {
    console.log("Invalidating all product caches for:", productId);
    
    // Invalidate all related cache keys
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
    queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
    
    // Also refetch specific product data to ensure immediate updates
    queryClient.refetchQueries({ queryKey: ['product', productId] });
  };

  // Function to handle image deletion
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
      
      // Unified cache invalidation
      invalidateAllCaches();

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

  // Function to set an image as primary
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
      invalidateAllCaches();
      
      // Optimistic update for admin products cache
      queryClient.setQueryData(['admin', 'products'], (oldData: any) => {
        if (!oldData) return oldData;
        
        // Update the product in the cache optimistically
        const updateProduct = (product: any) => {
          if (product.id === productId) {
            return {
              ...product,
              product_images: product.product_images?.map((img: any) => ({
                ...img,
                is_primary: img.url === imageUrl
              })) || []
            };
          }
          return product;
        };

        if (oldData.pages) {
          // For infinite query structure
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              products: page.products?.map(updateProduct) || []
            }))
          };
        } else if (oldData.products) {
          // For regular query structure
          return {
            ...oldData,
            products: oldData.products.map(updateProduct)
          };
        }
        
        return oldData;
      });
      
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

  // Handle image upload
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
        await handleSetPrimaryImage(newUrls[0]);
      }
      
      // Unified cache invalidation
      invalidateAllCaches();
      
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

      {showUpload && (
        <ImageUpload 
          images={images}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
          maxImages={maxImages}
          storageBucket={storageBucket}
        />
      )}
    </div>
  );
};
