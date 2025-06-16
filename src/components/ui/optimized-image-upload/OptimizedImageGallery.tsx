
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, X, Loader2 } from 'lucide-react';
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

  return (
    <div className="space-y-4">
      {/* Upload Progress */}
      {uploadQueue.length > 0 && (
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-medium text-sm">Загрузка изображений</h4>
          {uploadQueue.map((item) => (
            <div key={item.id} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {item.status === 'compressing' && <Loader2 className="h-3 w-3 animate-spin" />}
                  {item.status === 'uploading' && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
                  {item.status === 'success' && <div className="h-3 w-3 rounded-full bg-green-500" />}
                  {item.status === 'error' && <div className="h-3 w-3 rounded-full bg-red-500" />}
                  <span className="truncate max-w-[200px]">{item.file.name}</span>
                  {item.compressedSize && (
                    <span className="text-green-600">
                      {formatFileSize(item.originalSize)} → {formatFileSize(item.compressedSize)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    item.status === 'compressing' && "bg-yellow-100 text-yellow-800",
                    item.status === 'uploading' && "bg-blue-100 text-blue-800",
                    item.status === 'success' && "bg-green-100 text-green-800",
                    item.status === 'error' && "bg-red-100 text-red-800"
                  )}>
                    {item.status === 'compressing' && 'Сжатие'}
                    {item.status === 'uploading' && 'Загрузка'}
                    {item.status === 'success' && 'Готово'}
                    {item.status === 'error' && 'Ошибка'}
                  </span>
                  <span className="text-gray-500">{item.progress}%</span>
                </div>
              </div>
              
              {item.status !== 'success' && item.status !== 'error' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      item.status === 'compressing' && "bg-yellow-500",
                      item.status === 'uploading' && "bg-blue-500"
                    )}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

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
                
                {/* Upload overlay */}
                {isUploading && uploadItem && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <div className="text-xs">{uploadItem.progress}%</div>
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
