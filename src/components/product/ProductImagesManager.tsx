
import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProductImagesGallery } from "./ProductImagesGallery";

interface ProductImagesManagerProps {
  productId: string;
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete: (urlToDelete: string) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  primaryImage?: string;
  maxImages?: number;
  storageBucket?: string;
}

export const ProductImagesManager: React.FC<ProductImagesManagerProps> = ({
  productId,
  images,
  onImageUpload,
  onImageDelete,
  onPrimaryImageChange,
  primaryImage,
  maxImages = 25,
  storageBucket = "Product Images"
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  console.log("ProductImagesManager props:", {
    productId,
    imagesCount: images.length,
    primaryImage,
    onPrimaryImageChange: !!onPrimaryImageChange
  });

  // Function to handle image deletion - using AdminProductImagesManager logic
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

  // Function to set an image as primary - using AdminProductImagesManager logic
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
      
      // Update state in the parent component
      onPrimaryImageChange(imageUrl);
      
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

  // Handle image upload - using AdminProductImagesManager logic
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

  return (
    <>
      <ProductImagesGallery 
        images={images}
        onImageDelete={handleImageDelete}
        onSetPrimaryImage={onPrimaryImageChange ? handleSetPrimaryImage : undefined}
        primaryImage={primaryImage}
        deletingImage={deletingImage}
        settingPrimary={settingPrimary}
      />

      <ImageUpload 
        images={images}
        onUpload={handleImageUpload}
        onDelete={handleImageDelete}
        maxImages={maxImages}
        storageBucket={storageBucket}
      />
    </>
  );
};
