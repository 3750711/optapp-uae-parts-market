
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";

interface OrderMediaTabProps {
  order: any;
  orderImages: string[];
  orderVideos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

export const OrderMediaTab: React.FC<OrderMediaTabProps> = ({
  order,
  orderImages,
  orderVideos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete
}) => {
  const handleImageDelete = (url: string) => {
    // Remove from orderImages through parent component
    const newImages = orderImages.filter(img => img !== url);
    onImagesUpload(newImages);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Фотографии заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <MobileOptimizedImageUpload
            onUploadComplete={onImagesUpload}
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
            onUpload={onVideoUpload}
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
