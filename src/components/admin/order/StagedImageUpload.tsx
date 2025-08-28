import React, { useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Loader } from "lucide-react";
import { useStagedCloudinaryUpload } from "@/hooks/useStagedCloudinaryUpload";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StagedImageUploadProps {
  onImagesChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export const StagedImageUpload: React.FC<StagedImageUploadProps> = ({
  onImagesChange,
  maxImages = 25,
  disabled = false
}) => {
  const {
    stagedUrls,
    uploadItems,
    isUploading,
    uploadFiles,
    removeStagedUrl
  } = useStagedCloudinaryUpload();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check file limits
    const totalCount = stagedUrls.length + files.length;
    if (totalCount > maxImages) {
      alert(`Можно загрузить не более ${maxImages} изображений`);
      return;
    }

    // Validate file types
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      if (!isValid) {
        console.warn(`Invalid file type: ${file.type}`);
      }
      return isValid;
    });

    if (validFiles.length === 0) {
      alert('Пожалуйста, выберите только изображения');
      return;
    }

    const newUrls = await uploadFiles(validFiles);
    onImagesChange([...stagedUrls, ...newUrls]);
    
    // Clear the input
    event.target.value = '';
  }, [stagedUrls, maxImages, uploadFiles, onImagesChange]);

  const handleRemoveImage = useCallback(async (url: string) => {
    await removeStagedUrl(url);
    const updatedUrls = stagedUrls.filter(u => u !== url);
    onImagesChange(updatedUrls);
  }, [removeStagedUrl, stagedUrls, onImagesChange]);

  // Update parent when staged URLs change
  React.useEffect(() => {
    onImagesChange(stagedUrls);
  }, [stagedUrls, onImagesChange]);

  const canUploadMore = stagedUrls.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Progress */}
      {uploadItems.length > 0 && (
        <div className="space-y-2">
          {uploadItems.map(item => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm font-medium truncate">{item.file.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {item.status === 'compressing' ? 'Сжатие...' : 
                   item.status === 'uploading' ? 'Загрузка...' : 
                   item.status === 'success' ? 'Готово' :
                   item.status === 'error' ? 'Ошибка' : 'Ожидание'}
                  {item.metadata?.heic && ' (HEIC - отправлен оригинал)'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {item.status === 'error' && item.error && (
                  <span className="text-xs text-red-600">{item.error}</span>
                )}
                {item.status !== 'error' && (
                  <div className="text-sm text-gray-600">{item.progress}%</div>
                )}
                {item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading' ? (
                  <Loader className="h-4 w-4 animate-spin text-blue-500" />
                ) : item.status === 'success' ? (
                  <div className="h-4 w-4 bg-green-500 rounded-full" />
                ) : (
                  <div className="h-4 w-4 bg-red-500 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {canUploadMore && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">
                Загрузите изображения
              </h3>
              <p className="text-sm text-gray-600">
                {stagedUrls.length}/{maxImages} файлов
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={disabled || isUploading}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              {isUploading ? 'Загрузка...' : 'Выбрать файлы'}
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={disabled || isUploading}
            />
          </div>
        </div>
      )}

      {/* Staged Images Gallery */}
      {stagedUrls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {stagedUrls.map((url, index) => (
            <div key={url} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={url}
                  alt={`Загруженное изображение ${index + 1}`}
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
      )}

      {/* Info Alert */}
      {stagedUrls.length > 0 && (
        <Alert>
          <AlertDescription>
            Изображения загружены в промежуточное хранилище. После создания заказа они будут автоматически привязаны к нему.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};