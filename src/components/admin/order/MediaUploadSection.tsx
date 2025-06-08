
import React from "react";
import { Label } from "@/components/ui/label";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        
        <MobileOptimizedImageUpload
          onUploadComplete={handleNewImagesUpload}
          maxImages={25}
          existingImages={images}
          onImageDelete={handleImageDelete}
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label>Видео заказа</Label>
        
        <CloudinaryVideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          maxVideos={3}
          productId={orderId}
          buttonText="Загрузить видео заказа"
          disabled={disabled}
        />
      </div>
    </div>
  );
};
