
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";

interface OrderMediaTabProps {
  order: any;
  orderImages: string[];
  orderVideos: string[];
  onImagesChange: (urls: string[]) => void;
  onVideosChange: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

export const OrderMediaTab: React.FC<OrderMediaTabProps> = ({
  order,
  orderImages,
  orderVideos,
  onImagesChange,
  onVideosChange,
  onVideoDelete
}) => {
  const handleImageUpload = (uploadedUrls: string[]) => {
    const newImageList = [...orderImages, ...uploadedUrls];
    onImagesChange(newImageList);
  };
  
  const handleImageDelete = (urlToDelete: string) => {
    const newImageList = orderImages.filter(img => img !== urlToDelete);
    onImagesChange(newImageList);
  };

  const handleVideoUpload = (uploadedUrls: string[]) => {
    const newVideoList = [...orderVideos, ...uploadedUrls];
    onVideosChange(newVideoList);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Фотографии заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <MobileOptimizedImageUpload
            onUploadComplete={handleImageUpload}
            maxImages={20}
            existingImages={orderImages}
            onImageDelete={handleImageDelete}
            productId={order?.id}
            buttonText="Добавить фотографии к заказу"
            showOnlyButton={false}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Видеофайлы заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <CloudinaryVideoUpload
            videos={orderVideos}
            onUpload={handleVideoUpload}
            onDelete={onVideoDelete}
            maxVideos={3}
            productId={order?.id}
            buttonText="Загрузить видео заказа"
          />
        </CardContent>
      </Card>
    </div>
  );
};
