
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
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });

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
      return;
    }
    
    try {
      setSettingPrimary(imageUrl);
      
      // First, reset all images for this product to not primary
      const { error: resetError } = await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);
      
      if (resetError) {
        throw resetError;
      }
      
      // Then set the selected image as primary
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('product_id', productId)
        .eq('url', imageUrl);
      
      if (error) {
        throw error;
      }
      
      // Update state in the parent component immediately
      onPrimaryImageChange(imageUrl);
      
      // Invalidate React Query cache to refresh the data everywhere
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      
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
