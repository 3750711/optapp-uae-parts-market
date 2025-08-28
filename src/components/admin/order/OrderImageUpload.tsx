import React, { useState, useEffect } from 'react';
import { UnifiedImageUpload } from '@/components/ui/UnifiedImageUpload';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
  existingImages?: string[];
}

export const OrderImageUpload: React.FC<OrderImageUploadProps> = ({
  onImagesChange,
  maxImages = 25,
  disabled = false,
  existingImages = []
}) => {
  const [allImages, setAllImages] = useState<string[]>(existingImages);

  // Sync with external changes
  useEffect(() => {
    setAllImages(existingImages);
  }, [existingImages]);

  // Update parent when images change
  useEffect(() => {
    onImagesChange(allImages);
  }, [allImages, onImagesChange]);

  const handleImagesUploaded = (newUrls: string[]) => {
    console.log('📸 OrderImageUpload: New images uploaded:', newUrls);
    setAllImages(prev => [...prev, ...newUrls]);
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
        <div>
          <UnifiedImageUpload
            onImagesUploaded={handleImagesUploaded}
            maxImages={remainingSlots}
            maxFileSize={10 * 1024 * 1024} // 10MB
            disabled={disabled}
            showDiagnostics={false}
          />
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
