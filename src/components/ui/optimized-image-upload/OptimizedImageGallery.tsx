
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, X, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error';
  blobUrl?: string;
  finalUrl?: string;
  originalSize: number;
  compressedSize?: number;
}

interface OptimizedImageGalleryProps {
  images: string[];
  uploadQueue?: UploadItem[];
  primaryImage?: string;
  onSetPrimary?: (url: string) => void;
  onDelete?: (url: string) => void;
  disabled?: boolean;
  getImageStatus?: (url: string) => 'normal' | 'deleting';
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  uploadQueue = [],
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false,
  getImageStatus
}) => {
  // Валидация URL
  const isValidUrl = (url: string): boolean => {
    try {
      if (url.startsWith('blob:')) return true;
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Фильтрация активной очереди загрузки
  const activeUploadQueue = uploadQueue.filter(item => {
    if (item.status === 'error' || item.status === 'pending' || 
        item.status === 'compressing' || item.status === 'uploading') {
      return true;
    }
    
    if (item.status === 'success' && item.finalUrl) {
      return !images.includes(item.finalUrl);
    }
    
    return false;
  });

  // Все изображения для отображения
  const allImages = [
    // Загруженные изображения
    ...images
      .filter(isValidUrl)
      .map((url, index) => ({ 
        key: `uploaded-${index}-${url.slice(-20)}`,
        url, 
        type: 'uploaded' as const,
        uploadItem: null 
      })),
    // Изображения в процессе загрузки
    ...activeUploadQueue
      .filter(item => item.blobUrl && isValidUrl(item.blobUrl))
      .map(item => ({ 
        key: `uploading-${item.id}`,
        url: item.blobUrl!, 
        type: 'uploading' as const,
        uploadItem: item 
      }))
  ];

  if (allImages.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allImages.map((imageData) => {
          const { key, url, type, uploadItem } = imageData;
          const imageStatus = getImageStatus ? getImageStatus(url) : 'normal';
          const isUploading = type === 'uploading';
          const isUploaded = type === 'uploaded';
          
          return (
            <div 
              key={key} 
              className={cn(
                "relative aspect-square group transition-all duration-300",
                imageStatus === 'deleting' && "opacity-50 animate-pulse"
              )}
            >
              <img
                src={url}
                alt={`${type === 'uploaded' ? 'Загруженное' : 'Загружается'} изображение`}
                className="w-full h-full object-cover rounded-lg border"
                loading="lazy"
                onError={(e) => {
                  console.warn('⚠️ Image failed to load:', url);
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Статусы для загружающихся изображений */}
              {isUploading && uploadItem && (
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  {getStatusIcon(uploadItem.status)}
                  {uploadItem.status === 'success' && (
                    <span className="text-xs text-green-600 font-medium">Загружено</span>
                  )}
                </div>
              )}

              {/* Статус удаления */}
              {imageStatus === 'deleting' && (
                <div className="absolute top-2 left-2 bg-red-500 bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span className="text-xs text-white font-medium">Удаление</span>
                </div>
              )}

              {/* Статус "Загружено" для нормальных загруженных изображений */}
              {isUploaded && imageStatus === 'normal' && (
                <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-medium">Загружено</span>
                </div>
              )}
              
              {/* Информация о размере файла для загружающихся изображений */}
              {isUploading && uploadItem?.compressedSize && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-1 py-0.5">
                  <div className="text-xs text-green-300">
                    {formatFileSize(uploadItem.originalSize)} → {formatFileSize(uploadItem.compressedSize)}
                  </div>
                </div>
              )}
              
              {/* Бейдж главного изображения */}
              {primaryImage === url && isUploaded && imageStatus === 'normal' && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
              
              {/* Основные кнопки управления - показываем только для нормальных изображений */}
              {imageStatus === 'normal' && !disabled && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Кнопка "сделать главным" - только для загруженных изображений */}
                  {isUploaded && onSetPrimary && (
                    <Button
                      type="button"
                      size="sm"
                      variant={primaryImage === url ? "default" : "secondary"}
                      onClick={() => onSetPrimary(url)}
                      className="h-6 w-6 p-0"
                      title={primaryImage === url ? "Главное фото" : "Сделать главным"}
                    >
                      {primaryImage === url ? (
                        <Star className="h-3 w-3" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  {/* Кнопка удаления - только для загруженных изображений */}
                  {isUploaded && onDelete && (
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(url)}
                      className="h-6 w-6 p-0"
                      title="Удалить фото"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OptimizedImageGallery;
