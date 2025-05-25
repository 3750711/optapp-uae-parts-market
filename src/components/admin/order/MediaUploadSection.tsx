
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        
        {/* Отображение загруженных изображений */}
        {images.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Загруженные изображения ({images.length}):</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <div key={imageUrl} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img
                      src={imageUrl}
                      alt={`Order image ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <button
                    onClick={() => handleImageDelete(imageUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Удалить изображение"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <ImageUpload
          images={images}
          onUpload={onImagesUpload}
          onDelete={handleImageDelete}
          maxImages={25}
          storageBucket="Product Images"
        />
      </div>

      <div className="space-y-2">
        <Label>Видео заказа</Label>
        
        {/* Отображение загруженных видео */}
        {videos.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Загруженные видео ({videos.length}):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((videoUrl, index) => (
                <div key={videoUrl} className="relative group">
                  <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                  </div>
                  <button
                    onClick={() => onVideoDelete(videoUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Удалить видео"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <VideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          maxVideos={2}
          storageBucket="Product Images"
          storagePrefix=""
        />
      </div>
    </div>
  );
};
