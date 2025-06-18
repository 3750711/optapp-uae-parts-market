
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Image as ImageIcon, Video, Loader2, AlertCircle } from 'lucide-react';
import { useOptimizedImageUpload } from '@/hooks/useOptimizedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrderMediaUploadButtonsProps {
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxVideos?: number;
}

export const OrderMediaUploadButtons: React.FC<OrderMediaUploadButtonsProps> = ({
  images,
  videos,
  onImagesUpload,
  onVideoUpload,
  disabled = false,
  maxImages = 25,
  maxVideos = 5
}) => {
  const isMobile = useIsMobile();
  const [fileInputKey, setFileInputKey] = useState(0);
  const { uploadFiles, isUploading, uploadQueue } = useOptimizedImageUpload();

  console.log('📊 OrderMediaUploadButtons render:', { 
    imageCount: images.length, 
    videoCount: videos.length,
    isUploading
  });

  const handleImageSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('📁 Image files selected:', files.length);

    const fileArray = Array.from(files);
    
    // Валидация файлов изображений
    const validImageFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn('⚠️ Skipping non-image file:', file.name);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB лимит
        console.warn('⚠️ Skipping oversized file:', file.name, 'Size:', file.size);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) {
      toast({
        title: "Некорректные файлы",
        description: "Выберите изображения в формате JPG, PNG или WebP",
        variant: "destructive",
      });
      return;
    }

    // Проверка лимитов
    if (images.length + validImageFiles.length > maxImages) {
      toast({
        title: "Превышен лимит изображений",
        description: `Максимум ${maxImages} изображений. Сейчас: ${images.length}`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🚀 Starting upload of', validImageFiles.length, 'image files');
      
      const uploadedUrls = await uploadFiles(validImageFiles, {
        maxConcurrent: 2,
        disableToast: false,
        compressionOptions: {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1200,
          initialQuality: 0.8,
          fileType: 'image/webp'
        }
      });
      
      if (uploadedUrls.length > 0) {
        console.log('✅ New order images uploaded:', uploadedUrls);
        onImagesUpload(uploadedUrls);
        
        toast({
          title: "Изображения загружены",
          description: `Успешно загружено ${uploadedUrls.length} из ${validImageFiles.length} изображений`,
        });
      } else {
        console.warn('⚠️ No images were successfully uploaded');
      }
    } catch (error) {
      console.error('💥 Error uploading order images:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображения",
        variant: "destructive",
      });
    }
    
    // Сброс input
    setFileInputKey(prev => prev + 1);
  }, [uploadFiles, onImagesUpload, images.length, maxImages]);

  // Получение активных загрузок для отображения прогресса
  const activeUploads = uploadQueue.filter(item => 
    item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading'
  );

  const canUploadImages = !disabled && images.length < maxImages && !isUploading;
  const canUploadVideos = !disabled && videos.length < maxVideos;

  return (
    <div className="space-y-4">
      {/* Кнопки загрузки */}
      <div className={cn(
        "grid gap-3",
        isMobile ? "grid-cols-1" : "grid-cols-2"
      )}>
        {/* Кнопка загрузки изображений */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-50 mx-auto">
                <ImageIcon className="w-6 h-6 text-blue-600" />
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Изображения заказа</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {images.length}/{maxImages} загружено
                </p>
              </div>

              <Button
                type="button"
                variant={canUploadImages ? "default" : "secondary"}
                disabled={!canUploadImages}
                onClick={() => document.getElementById('order-image-input')?.click()}
                className={cn(
                  "w-full",
                  isMobile ? "min-h-[44px]" : "h-10"
                )}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Добавить фото
                  </>
                )}
              </Button>

              <input
                key={fileInputKey}
                id="order-image-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                disabled={!canUploadImages}
              />

              {!canUploadImages && images.length >= maxImages && (
                <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Достигнут лимит изображений
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Кнопка загрузки видео */}
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-50 mx-auto">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              
              <div>
                <h3 className="font-medium text-sm">Видео заказа</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {videos.length}/{maxVideos} загружено
                </p>
              </div>

              <CloudinaryVideoUpload
                videos={videos}
                onUpload={onVideoUpload}
                onDelete={() => {}} // Удаление через галерею
                maxVideos={maxVideos}
                disabled={!canUploadVideos}
                showOnlyButton={true}
                buttonText="Добавить видео"
                buttonIcon={<Upload className="h-4 w-4" />}
                className={cn(
                  "w-full",
                  isMobile ? "min-h-[44px]" : "h-10"
                )}
              />

              {!canUploadVideos && videos.length >= maxVideos && (
                <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Достигнут лимит видео
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Прогресс загрузки */}
      {activeUploads.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Загрузка файлов ({activeUploads.length})</h4>
              {activeUploads.map((upload) => (
                <div key={upload.id} className="flex items-center gap-2 text-xs">
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="flex-1 truncate">{upload.file.name}</span>
                  <span className="text-gray-500">{upload.progress}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Информация */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>📸 Изображения сжимаются автоматически при размере больше 400KB</p>
        <p>🎬 Поддерживаемые форматы видео: MP4, MOV, AVI (до 100MB)</p>
        <p>☁️ Все файлы загружаются в Cloudinary с оптимизацией</p>
      </div>
    </div>
  );
};
