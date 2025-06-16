

import React from 'react';
import { Button } from '@/components/ui/button';
import { Star, StarOff, X, Loader2, CheckCircle, Trash2 } from 'lucide-react';
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
  deletingImage?: string | null; // Add this prop to track which image is being deleted
}

const OptimizedImageGallery: React.FC<OptimizedImageGalleryProps> = ({
  images,
  uploadQueue = [],
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false,
  deletingImage = null
}) => {
  // Filter out upload queue items that have been successfully uploaded and are already in images array
  const activeUploadQueue = uploadQueue.filter(item => {
    // Keep items that are still uploading or failed
    if (item.status === 'error' || item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading') {
      return true;
    }
    // For successful uploads, only keep if the final URL is not in the images array yet
    if (item.status === 'success' && item.finalUrl) {
      return !images.includes(item.finalUrl);
    }
    return false;
  });

  // Combine uploaded images with active upload queue previews
  const allImages = [
    ...images.map(url => ({ url, isUploaded: true, uploadItem: null })),
    ...activeUploadQueue
      .filter(item => item.blobUrl)
      .map(item => ({ 
        url: item.blobUrl!, 
        isUploaded: false, 
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
      {/* Image Grid - Show ALL images always */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allImages.map((imageData, index) => {
          const { url, isUploaded, uploadItem } = imageData;
          const isCurrentlyUploading = !isUploaded && uploadItem;
          const isBeingDeleted = deletingImage === url;
          
          return (
            <div key={`${url}-${index}`} className="relative aspect-square group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className={cn(
                  "w-full h-full object-cover rounded-lg border",
                  isBeingDeleted && "opacity-50"
                )}
                loading="lazy"
              />
              
              {/* Status overlay for uploading images */}
              {isCurrentlyUploading && uploadItem && (
                <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  {getStatusIcon(uploadItem.status)}
                  {uploadItem.status === 'success' && (
                    <span className="text-xs text-green-600 font-medium">Загружено</span>
                  )}
                </div>
              )}

              {/* Deleted status for images being deleted */}
              {isBeingDeleted && (
                <div className="absolute top-2 left-2 bg-red-500 bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  <Trash2 className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-medium">Удалено</span>
                </div>
              )}

              {/* Success badge for uploaded images (only if not being deleted) */}
              {isUploaded && !isBeingDeleted && (
                <div className="absolute top-2 left-2 bg-green-500 bg-opacity-90 rounded-md px-2 py-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4 text-white" />
                  <span className="text-xs text-white font-medium">Загружено</span>
                </div>
              )}
              
              {/* File size info for uploading images */}
              {isCurrentlyUploading && uploadItem && uploadItem.compressedSize && (
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 rounded px-1 py-0.5">
                  <div className="text-xs text-green-300">
                    {formatFileSize(uploadItem.originalSize)} → {formatFileSize(uploadItem.compressedSize)}
                  </div>
                </div>
              )}
              
              {/* Primary badge */}
              {primaryImage === url && isUploaded && !isBeingDeleted && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Главное
                </div>
              )}
              
              {/* Controls - show for uploaded images and conditionally for uploading */}
              {!isBeingDeleted && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Primary button - only for uploaded images */}
                  {isUploaded && onSetPrimary && (
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
                  
                  {/* Delete button - show for uploaded images */}
                  {isUploaded && onDelete && (
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
    </div>
  );
};

export default OptimizedImageGallery;

