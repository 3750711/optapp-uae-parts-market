import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Camera } from 'lucide-react';
import { useNewCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from '@/lib/utils';

interface CloudinaryPhotoUploaderProps {
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete?: (urlToDelete: string) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
}

export const CloudinaryPhotoUploader: React.FC<CloudinaryPhotoUploaderProps> = ({
  images = [],
  onImageUpload,
  onImageDelete,
  maxImages = 10,
  className,
  disabled = false
}) => {
  const { isUploading, uploadProgress, openUploadWidget } = useNewCloudinaryUpload();

  const canUploadMore = images.length < maxImages;
  const remainingSlots = maxImages - images.length;

  const handleUpload = () => {
    if (!canUploadMore || disabled) return;

    openUploadWidget(
      (results) => {
        const newUrls = results.map(result => result.secure_url);
        onImageUpload(newUrls);
      },
      {
        multiple: true,
        maxFiles: remainingSlots,
        folder: 'product-images'
      }
    );
  };

  const handleDelete = (imageUrl: string) => {
    if (onImageDelete) {
      onImageDelete(imageUrl);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">Фотографии товара</h3>
          <span className="text-xs text-muted-foreground">
            ({images.length}/{maxImages})
          </span>
        </div>
        
        <Button
          onClick={handleUpload}
          disabled={!canUploadMore || disabled || isUploading}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {isUploading ? 'Загрузка...' : 'Добавить фото'}
        </Button>
      </div>

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
                  <Progress value={item.progress} className="h-2" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              
              {/* Delete Button */}
              {onImageDelete && (
                <button
                  onClick={() => handleDelete(imageUrl)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-destructive/90"
                  aria-label="Удалить фото"
                >
                  <X className="w-3 h-3" />
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

      {/* Info */}
      <div className="text-xs text-muted-foreground">
        <p>• Поддерживаются форматы: JPG, PNG, WebP, GIF</p>
        <p>• Максимальный размер файла: 10 МБ</p>
        <p>• Изображения автоматически оптимизируются</p>
      </div>
    </div>
  );
};