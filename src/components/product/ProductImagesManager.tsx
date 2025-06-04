import React, { useState } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProductImagesGallery } from "./ProductImagesGallery";
import { generateProductPreview, updateProductPreview } from "@/utils/previewGenerator";

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

  // Function to set an image as primary and generate preview if needed
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
      
      // Generate preview for the new primary image
      console.log('Generating preview for new primary image:', imageUrl);
      const previewResult = await generateProductPreview(imageUrl, productId);
      
      if (previewResult.success && previewResult.previewUrl) {
        // Update product with new preview URL
        await updateProductPreview(productId, previewResult.previewUrl);
        
        toast({
          title: "Успешно",
          description: `Основное фото установлено и превью создано (${Math.round((previewResult.previewSize || 0) / 1024)}KB)`,
        });
      } else {
        toast({
          title: "Частично успешно",
          description: "Основное фото установлено, но превью не удалось создать",
        });
      }
      
      // Invalidate React Query cache to refresh the data everywhere
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      
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

  // Handle image upload with automatic preview generation
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
      
      // If no primary image is set, set the first new image as primary and generate preview
      if (!primaryImage && newUrls.length > 0 && onPrimaryImageChange) {
        await handleSetPrimaryImage(newUrls[0]);
      } else if (newUrls.length > 0) {
        // Generate preview for the first uploaded image even if it's not primary
        console.log('Generating preview for uploaded image:', newUrls[0]);
        const previewResult = await generateProductPreview(newUrls[0], productId);
        
        if (previewResult.success && previewResult.previewUrl) {
          await updateProductPreview(productId, previewResult.previewUrl);
          console.log('Preview generated and saved for product:', productId);
        }
      }
      
      // Invalidate React Query cache to refresh the data
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
      
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
