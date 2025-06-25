
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { useIsMobile } from '@/hooks/use-mobile';
import { Camera, Video } from 'lucide-react';

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
  const isMobile = useIsMobile();

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
    <div className={`space-y-4 ${isMobile ? 'px-1' : 'space-y-6'}`}>
      <Card>
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Camera className="h-5 w-5" />
            Фотографии заказа
            {orderImages.length > 0 && (
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                {orderImages.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'pt-0' : ''}>
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
        <CardHeader className={isMobile ? 'pb-3' : ''}>
          <CardTitle className={`${isMobile ? 'text-base' : 'text-lg'} flex items-center gap-2`}>
            <Video className="h-5 w-5" />
            Видеофайлы заказа
            {orderVideos.length > 0 && (
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                {orderVideos.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={isMobile ? 'pt-0' : ''}>
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
