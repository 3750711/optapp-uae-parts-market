import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, X, Loader2, CheckCircle, Trash2 } from 'lucide-react';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error' | 'deleted';
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
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  uploadQueue = [],
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false
}) => {
  console.log('🎨 OptimizedImageGallery render:', { 
    imageCount: images.length, 
    uploadQueueLength: uploadQueue.length 
  });

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

  // Улучшенная фильтрация активной очереди загрузки
  const activeUploadQueue = uploadQueue.filter(item => {
    // Исключаем удаленные элементы полностью
    if (item.status === 'deleted') {
      console.log('🗑️ Filtering out deleted item:', item.finalUrl || item.blobUrl);
      return false;
    }
    
    // Показываем элементы с ошибкой для возможности повторной попытки
    if (item.status === 'error') {
      return true;
    }
    
    // Показываем элементы в процессе загрузки
    if (item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading') {
      return true;
    }
    
    // Для успешно загруженных элементов - показываем только если их еще нет в основном массиве
    if (item.status === 'success' && item.finalUrl) {
      const isAlreadyInImages = images.includes(item.finalUrl);
      console.log('🔍 Checking successful item:', { 
        url: item.finalUrl, 
        isAlreadyInImages,
        shouldShow: !isAlreadyInImages 
      });
      return !isAlreadyInImages;
    }
    
    return false;
  });

  console.log('🔄 Active upload queue:', { 
    total: uploadQueue.length, 
    active: activeUploadQueue.length,
    statuses: activeUploadQueue.map(item => ({ 
      status: item.status, 
      url: item.finalUrl || item.blobUrl 
    }))
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
    // Изображения в процессе загрузки (только активные)
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
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Uploaded';
      case 'error':
        return 'Error';
      case 'deleted':
        return 'Deleted';
      case 'compressing':
        return 'Compressing';
      case 'uploading':
        return 'Uploading';
      default:
        return 'Processing';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-500 bg-opacity-90 text-white';
      case 'error':
        return 'bg-red-500 bg-opacity-90 text-white';
      case 'deleted':
        return 'bg-red-500 bg-opacity-90 text-white';
      default:
        return 'bg-white bg-opacity-90 text-gray-800';
    }
  };

  const handleDelete = (url: string) => {
    console.log('🗑️ Gallery delete button clicked for:', url);
    if (onDelete && !disabled) {
      onDelete(url);
    }
  };

  const handleSetPrimary = (url: string) => {
    console.log('⭐ Gallery primary button clicked for:', url);
    if (onSetPrimary && !disabled) {
      onSetPrimary(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allImages.map((imageData) => {
          const { key, url, type, uploadItem } = imageData;
          const isUploading = type === 'uploading';
          const isUploaded = type === 'uploaded';
          
          return (
            <div 
              key={key} 
              className="relative aspect-square group transition-all duration-300"
            >
              <img
                src={url}
                alt={`${type === 'uploaded' ? 'Uploaded' : 'Uploading'} image`}
                className="w-full h-full object-cover rounded-lg border"
                loading="lazy"
                onError={(e) => {
                  console.warn('⚠️ Image failed to load:', url);
                  e.currentTarget.style.display = 'none';
                }}
              />
              
              {/* Статусы для загружающихся изображений */}
              {isUploading && uploadItem && uploadItem.status !== 'deleted' && (
                <div className={`absolute top-2 left-2 rounded-md px-2 py-1 flex items-center gap-1 ${getStatusColor(uploadItem.status)}`}>
                  {getStatusIcon(uploadItem.status)}
                  <span className="text-xs font-medium">{getStatusText(uploadItem.status)}</span>
                </div>
              )}

              {/* Статус "Загружено" для нормальных загруженных изображений */}
              {isUploaded && (
                <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-medium">Uploaded</span>
                </div>
              )}
              
              {/* Информация о размере файла - только для активных загрузок */}
              {isUploading && uploadItem?.compressedSize && 
               uploadItem.status !== 'deleted' && 
               uploadItem.status !== 'error' && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-1 py-0.5">
                  <div className="text-xs text-green-300">
                    {formatFileSize(uploadItem.originalSize)} → {formatFileSize(uploadItem.compressedSize)}
                  </div>
                </div>
              )}
              
              {/* Бейдж главного изображения */}
              {primaryImage === url && isUploaded && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Primary
                </div>
              )}
              
              {/* Кнопки управления - только для загруженных изображений */}
              {isUploaded && !disabled && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Кнопка "сделать главным" */}
                  {onSetPrimary && (
                    <Button
                      type="button"
                      size="sm"
                      variant={primaryImage === url ? "default" : "secondary"}
                      onClick={() => handleSetPrimary(url)}
                      className="h-6 w-6 p-0"
                      title={primaryImage === url ? "Primary Photo" : "Set as Primary"}
                    >
                      {primaryImage === url ? (
                        <Star className="h-3 w-3" />
                      ) : (
                        <StarOff className="h-3 w-3" />
                      )}
                    </Button>
                  )}
                  
                  {/* Кнопка удаления */}
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(url)}
                    className="h-6 w-6 p-0"
                    title="Delete Photo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
