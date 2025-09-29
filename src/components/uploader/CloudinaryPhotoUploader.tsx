import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Camera } from 'lucide-react';
import { useNewCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from '@/lib/utils';
import { CloudinaryNormalized } from '@/types/cloudinary';

interface CloudinaryPhotoUploaderProps {
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete?: (urlToDelete: string) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  onWidgetStateChange?: (isOpen: boolean) => void;
}

export const CloudinaryPhotoUploader: React.FC<CloudinaryPhotoUploaderProps> = ({
  images = [],
  onImageUpload,
  onImageDelete,
  maxImages = 10,
  className,
  disabled = false,
  onWidgetStateChange
}) => {
  const { isUploading, uploadProgress, openUploadWidget } = useNewCloudinaryUpload();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Notify parent component about widget state changes
  useEffect(() => {
    onWidgetStateChange?.(isWidgetOpen);
  }, [isWidgetOpen, onWidgetStateChange]);

  const canUploadMore = images.length < maxImages;
  const remainingSlots = maxImages - images.length;

  const handleUpload = () => {
    if (!canUploadMore || disabled) return;

    // Widget будет открыт - устанавливаем состояние
    setIsWidgetOpen(true);
    
    openUploadWidget(
      (results: CloudinaryNormalized[]) => {
        console.log('🎯 CloudinaryPhotoUploader received normalized results:', results);
        
        if (process.env.NODE_ENV !== "production") {
          console.debug("[CloudinaryPhotoUploader] raw results:", results);
          console.debug("[CloudinaryPhotoUploader] normalized:", results);
        }
        
        const newUrls = results.map(result => result.url).filter(Boolean);
        
        console.log('📸 Final URLs to upload:', newUrls);
        onImageUpload(newUrls);
        
        // Widget закрыт после успешной загрузки - сбрасываем состояние
        setIsWidgetOpen(false);
      },
      {
        multiple: true,
        maxFiles: remainingSlots,
        folder: 'product-images'
      }
    );

    // Слушаем событие закрытия виджета для сброса состояния
    // Используем setTimeout для установки listener'а после создания виджета
    setTimeout(() => {
      const handleWidgetClose = () => {
        setIsWidgetOpen(false);
        document.removeEventListener('cloudinary-widget-close', handleWidgetClose);
      };
      document.addEventListener('cloudinary-widget-close', handleWidgetClose);
    }, 100);
  };

  const handleDelete = (imageUrl: string) => {
    if (onImageDelete) {
      onImageDelete(imageUrl);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button - Mobile Optimized */}
      <Button
        type="button"
        onClick={handleUpload}
        disabled={!canUploadMore || disabled || isUploading}
        variant="outline"
        size="lg"
        className="flex items-center gap-2 w-full min-h-[48px] text-base touch-manipulation sm:w-auto sm:min-h-[40px] sm:text-sm"
      >
        <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
        {isUploading ? 'Загрузка...' : 'Добавить фото'}
      </Button>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">Прогресс загрузки</h4>
            <div className="space-y-2">
              {uploadProgress.map((item) => (
                <div key={item.fileId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate">{item.fileName}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-3 sm:h-2" />
                  {item.error && (
                    <p className="text-xs text-destructive">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {images.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt={`Фото товара ${index + 1}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              
              {/* Delete Button - Mobile Optimized */}
              {onImageDelete && (
                <button
                  onClick={() => handleDelete(imageUrl)}
                  className="absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 touch-manipulation transition-opacity shadow-lg hover:bg-destructive/90 active:scale-95"
                  aria-label="Удалить фото"
                >
                  <X className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};