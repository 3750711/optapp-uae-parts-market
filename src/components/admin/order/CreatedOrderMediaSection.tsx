
import React, { useState } from 'react';
import { Camera, Video, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptimizedImageUpload } from '@/hooks/useOptimizedImageUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { CompactMediaGrid } from '@/components/media/CompactMediaGrid';

interface CreatedOrderMediaSectionProps {
  orderId: string;
  images: string[];
  videos: string[];
  onImagesUpdate: (newImages: string[]) => void;
  onVideosUpdate: (newVideos: string[]) => void;
}

export const CreatedOrderMediaSection: React.FC<CreatedOrderMediaSectionProps> = ({
  orderId,
  images,
  videos,
  onImagesUpdate,
  onVideosUpdate
}) => {
  const isMobile = useIsMobile();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const { uploadFiles } = useOptimizedImageUpload();
  const { uploadMultipleVideos } = useCloudinaryVideoUpload();

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsImageUploading(true);
    try {
      const fileArray = Array.from(files);
      console.log('📸 Uploading images for order:', orderId, fileArray.length, 'files');

      const uploadedUrls = await uploadFiles(fileArray, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 1200,
        initialQuality: 0.8,
        fileType: 'image/webp'
      });

      if (uploadedUrls.length > 0) {
        const newImages = [...images, ...uploadedUrls];
        onImagesUpdate(newImages);
        
        toast({
          title: "Фото добавлены",
          description: `Добавлено ${uploadedUrls.length} фото к заказу`,
        });
      }
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleVideoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsVideoUploading(true);
    try {
      const fileArray = Array.from(files);
      console.log('🎥 Uploading videos for order:', orderId, fileArray.length, 'files');

      const results = await uploadMultipleVideos(fileArray);
      const uploadedUrls = results.map(result => result.url).filter(Boolean);
      
      if (uploadedUrls.length > 0) {
        const newVideos = [...videos, ...uploadedUrls];
        onVideosUpdate(newVideos);
        
        toast({
          title: "Видео добавлены",
          description: `Добавлено ${uploadedUrls.length} видео к заказу`,
        });
      }
    } catch (error) {
      console.error('❌ Error uploading videos:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить видео",
        variant: "destructive",
      });
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageDelete = (urlToDelete: string) => {
    const newImages = images.filter(url => url !== urlToDelete);
    onImagesUpdate(newImages);
    toast({
      title: "Фото удалено",
      description: "Фото удалено из заказа",
    });
  };

  const handleVideoDelete = (urlToDelete: string) => {
    const newVideos = videos.filter(url => url !== urlToDelete);
    onVideosUpdate(newVideos);
    toast({
      title: "Видео удалено",
      description: "Видео удалено из заказа",
    });
  };

  const totalMediaCount = images.length + videos.length;

  return (
    <div className="space-y-4">
      {/* Header with media count */}
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
          Медиафайлы заказа ({totalMediaCount})
        </h3>
        {totalMediaCount > 0 && (
          <div className="text-sm text-gray-500">
            📸 {images.length} • 🎥 {videos.length}
          </div>
        )}
      </div>

      {/* Upload buttons */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Add Photos Button */}
        <div>
          <input
            type="file"
            id={`order-images-${orderId}`}
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById(`order-images-${orderId}`)?.click()}
            disabled={isImageUploading}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-blue-50`}
          >
            {isImageUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Загрузка фото...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Добавить фото к заказу
              </>
            )}
          </Button>
        </div>

        {/* Add Videos Button */}
        <div>
          <input
            type="file"
            id={`order-videos-${orderId}`}
            multiple
            accept="video/*"
            onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById(`order-videos-${orderId}`)?.click()}
            disabled={isVideoUploading}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-green-50`}
          >
            {isVideoUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Загрузка видео...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Добавить видео к заказу
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Compact Media Grid - shows all media at once */}
      {totalMediaCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <CompactMediaGrid
              images={images}
              videos={videos}
              maxPreviewItems={50}
              onImageDelete={handleImageDelete}
              onVideoDelete={handleVideoDelete}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Фото автоматически сжимаются до 400KB и конвертируются в WebP</p>
        <p>• Поддержка JPG, PNG, GIF для фото • MP4, MOV, AVI для видео</p>
        <p>• Максимум 25 фото и 5 видео на заказ</p>
      </div>
    </div>
  );
};
