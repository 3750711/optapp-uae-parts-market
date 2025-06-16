
import React from "react";
import { EnhancedMediaUploadSection } from "./EnhancedMediaUploadSection";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MediaUploadSectionProps {
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  orderId?: string;
  disabled?: boolean;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  videos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete,
  orderId,
  disabled = false,
}) => {
  
  const handleImageDelete = async (url: string) => {
    if (!orderId) {
      console.log("Image delete requested, but no order ID provided:", url);
      // Update local state for preview even without order ID
      const updatedImages = images.filter(imageUrl => imageUrl !== url);
      onImagesUpload(updatedImages);
      return;
    }

    try {
      // Remove image from the images array by updating the order
      const updatedImages = images.filter(imageUrl => imageUrl !== url);
      
      // Update the images field in the orders table
      const { error } = await supabase
        .from('orders')
        .update({ images: updatedImages })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state through parent component
      onImagesUpload(updatedImages);

      toast({
        title: "Успешно",
        description: "Изображение удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
      
      // Still update local state for preview even if DB update failed
      const updatedImages = images.filter(imageUrl => imageUrl !== url);
      onImagesUpload(updatedImages);
    }
  };

  const handleNewImagesUpload = async (newUrls: string[]) => {
    if (!orderId) {
      console.log("New images upload requested, but no order ID provided:", newUrls);
      // Still update local state for preview
      const allImages = [...images, ...newUrls];
      onImagesUpload(allImages);
      return;
    }

    try {
      // Combine existing images with new ones
      const allImages = [...images, ...newUrls];
      
      // Update the images field in the orders table
      const { error } = await supabase
        .from('orders')
        .update({ images: allImages })
        .eq('id', orderId);

      if (error) throw error;

      // Update local state through parent component
      onImagesUpload(allImages);

      toast({
        title: "Успешно",
        description: `Загружено ${newUrls.length} изображений`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить изображения заказа",
        variant: "destructive",
      });
      
      // Still update local state for preview even if DB update failed
      const allImages = [...images, ...newUrls];
      onImagesUpload(allImages);
    }
  };

  const handleSetPrimaryImage = async (url: string) => {
    if (!orderId) {
      console.log("Set primary image requested, but no order ID provided:", url);
      return;
    }

    try {
      // For orders, we can set the primary image by moving it to the first position
      const updatedImages = [url, ...images.filter(img => img !== url)];
      
      const { error } = await supabase
        .from('orders')
        .update({ images: updatedImages })
        .eq('id', orderId);

      if (error) throw error;

      onImagesUpload(updatedImages);
      
      toast({
        title: "Успешно",
        description: "Главное изображение установлено",
      });
    } catch (error) {
      console.error('Error setting primary image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось установить главное изображение",
        variant: "destructive",
      });
    }
  };

  return (
    <EnhancedMediaUploadSection
      images={images}
      videos={videos}
      onImagesUpload={handleNewImagesUpload}
      onVideoUpload={onVideoUpload}
      onVideoDelete={onVideoDelete}
      onImageDelete={handleImageDelete}
      onSetPrimaryImage={handleSetPrimaryImage}
      primaryImage={images[0]} // First image is considered primary
      orderId={orderId}
      disabled={disabled}
      maxImages={25}
      maxVideos={3}
    />
  );
};
