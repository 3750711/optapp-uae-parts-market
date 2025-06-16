
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
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  uploadQueue = [],
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false
}) => {
  // Combine uploaded images with upload queue previews
  const allImages = [
    ...images,
    ...uploadQueue
      .filter(item => item.blobUrl && item.status !== 'success')
      .map(item => item.blobUrl!)
  ];

  if (allImages.length === 0 && uploadQueue.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'compressing':
        return 'Сжатие';
      case 'uploading':
        return 'Загружается';
      case 'success':
        return 'Загружено';
      case 'error':
        return 'Ошибка';
      default:
        return 'Ожидание';
    }
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
      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {allImages.map((url, index) => {
            const isUploading = uploadQueue.some(item => item.blobUrl === url && item.status !== 'success');
            const uploadItem = uploadQueue.find(item => item.blobUrl === url);
            
            return (
              <div key={`${url}-${index}`} className="relative aspect-square group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className={cn(
                    "w-full h-full object-cover rounded-lg border",
                    isUploading && "opacity-70"
                  )}
                  loading="lazy"
                />
                
                {/* Upload status overlay */}
                {isUploading && uploadItem && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex flex-col items-center justify-center">
                    <div className="text-white text-center">
                      {getStatusIcon(uploadItem.status)}
                      <div className="text-xs mt-2 font-medium">
                        {getStatusText(uploadItem.status)}
                      </div>
                      {uploadItem.compressedSize && (
                        <div className="text-xs mt-1 text-green-300">
                          {formatFileSize(uploadItem.originalSize)} → {formatFileSize(uploadItem.compressedSize)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Primary badge */}
                {primaryImage === url && !isUploading && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Главное
                  </div>
                )}
                
                {/* Controls */}
                {!isUploading && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onSetPrimary && (
                      <Button
                        type="button"
                        size="sm"
                        variant={primaryImage === url ? "default" : "secondary"}
                        onClick={() => onSetPrimary(url)}
                        className="h-6 w-6 p-0"
                        disabled={disabled}
                        title={primaryImage === url ? "Главное фото" : "Сделать главным"}
                      >
                        {primaryImage === url ? (
                          <Star className="h-3 w-3" />
                        ) : (
                          <StarOff className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                    
                    {onDelete && (
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(url)}
                        className="h-6 w-6 p-0"
                        disabled={disabled}
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
      )}
    </div>
  );
};

export default OptimizedImageGallery;
