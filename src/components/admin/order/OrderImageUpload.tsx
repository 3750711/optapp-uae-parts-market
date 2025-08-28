import React, { useState, useEffect } from 'react';
import { useStagedCloudinaryUpload } from '@/hooks/useStagedCloudinaryUpload';
import { Button } from '@/components/ui/button';
import { X, Upload } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/loading/LoadingSpinner';

interface OrderImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  existingImages?: string[];
  sessionId: string;
}

export const OrderImageUpload: React.FC<OrderImageUploadProps> = ({
  onImagesChange,
  maxImages = 25,
  disabled = false,
  existingImages = [],
  sessionId
}) => {
  const [allImages, setAllImages] = useState<string[]>(existingImages);
  const { uploadFiles, uploadItems, isUploading } = useStagedCloudinaryUpload();
  const [isDragOver, setIsDragOver] = useState(false);

  // Sync with external changes
  useEffect(() => {
    setAllImages(existingImages);
  }, [existingImages]);

  // Update parent when images change
  useEffect(() => {
    onImagesChange(allImages);
  }, [allImages, onImagesChange]);

  const handleImagesUploaded = async (files: File[]) => {
    if (disabled || files.length === 0) return;

    console.log('📸 OrderImageUpload: Starting upload of', files.length, 'files');
    
    try {
      const newUrls = await uploadFiles(files);
      console.log('📸 OrderImageUpload: Upload completed:', newUrls);
      
      if (newUrls.length > 0) {
        setAllImages(prev => [...prev, ...newUrls]);
      }
    } catch (error) {
      console.error('❌ OrderImageUpload: Upload failed:', error);
    }
  };

  const handleRemoveImage = (urlToRemove: string) => {
    console.log('🗑️ OrderImageUpload: Removing image:', urlToRemove);
    setAllImages(prev => prev.filter(url => url !== urlToRemove));
  };

  const canUploadMore = allImages.length < maxImages;
  const remainingSlots = maxImages - allImages.length;

  return (
    <div className="space-y-4">
      {/* Existing Images Gallery */}
      {allImages.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Загруженные изображения ({allImages.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allImages.map((url, index) => (
              <div key={url} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Изображение заказа ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(url)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Основное
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Component */}
      {canUploadMore && (
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : disabled 
                ? 'border-muted-foreground/25 bg-muted/50' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (!disabled) {
                const files = Array.from(e.dataTransfer.files).filter(file => 
                  file.type.startsWith('image/')
                );
                if (files.length > 0) {
                  handleImagesUploaded(files.slice(0, remainingSlots));
                }
              }
            }}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              id="image-upload"
              disabled={disabled || isUploading}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  handleImagesUploaded(files.slice(0, remainingSlots));
                  e.target.value = '';
                }
              }}
            />
            
            {isUploading ? (
              <div className="space-y-3">
                <LoadingSpinner size="lg" />
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Загрузка изображений...</p>
                  {uploadItems.map((item, index) => (
                    <div key={item.id} className="text-sm text-muted-foreground">
                      Файл {index + 1}: {item.status === 'compressing' && 'Сжатие...'}
                      {item.status === 'signing' && 'Получение подписи...'}
                      {item.status === 'uploading' && `Загрузка... ${item.progress}%`}
                      {item.status === 'success' && '✅ Готово'}
                      {item.status === 'error' && `❌ Ошибка: ${item.error}`}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-lg font-medium text-foreground">
                    Перетащите изображения или{' '}
                    <label htmlFor="image-upload" className="text-primary cursor-pointer hover:underline">
                      выберите файлы
                    </label>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Можно загрузить еще {remainingSlots} {remainingSlots === 1 ? 'изображение' : 'изображений'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Максимальный размер файла: 10 МБ
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Alert */}
      {allImages.length > 0 && (
        <Alert>
          <AlertDescription>
            Изображения будут сохранены при создании заказа. Первое изображение станет основным.
          </AlertDescription>
        </Alert>
      )}

      {!canUploadMore && (
        <Alert>
          <AlertDescription>
            Достигнуто максимальное количество изображений ({maxImages}). Удалите некоторые изображения для загрузки новых.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
