
import React from "react";
import { Label } from "@/components/ui/label";
import { VideoUpload } from "@/components/ui/video-upload";
import { ImageUpload } from "@/components/ui/image-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface MediaUploadSectionProps {
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  orderId?: string;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  videos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete,
  orderId,
}) => {
  
  const handleImageDelete = async (url: string) => {
    if (!orderId) {
      console.log("Image delete requested, but no order ID provided:", url);
      return;
    }

    try {
      // Удаляем изображение из базы данных
      const { error } = await supabase
        .from('order_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', url);

      if (error) throw error;

      // Обновляем локальное состояние через родительский компонент
      // Создаем новый массив без удаленного изображения
      const updatedImages = images.filter(imageUrl => imageUrl !== url);
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        <ImageUpload
          images={images}
          onUpload={onImagesUpload}
          onDelete={handleImageDelete}
          maxImages={25}
          storageBucket="order-images"
        />
      </div>

      <div className="space-y-2">
        <Label>Видео заказа</Label>
        <VideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          maxVideos={2}
          storageBucket="order-videos"
          storagePrefix=""
        />
      </div>
    </div>
  );
};
