
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star, StarOff, Eye, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error' | 'deleted';
  error?: string;
  blobUrl?: string;
  finalUrl?: string;
  originalSize: number;
  compressedSize?: number;
}

interface OrderImageGalleryProps {
  images: string[];
  uploadQueue: OrderUploadItem[];
  primaryImage?: string;
  onSetPrimary?: (url: string) => void;
  onDelete: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

const OrderImageGallery: React.FC<OrderImageGalleryProps> = ({
  images,
  uploadQueue,
  primaryImage,
  onSetPrimary,
  onDelete,
  disabled = false,
  maxImages = 25
}) => {
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Combine existing images with upload queue items
  const allItems = [
    ...images.map((url, index) => ({
      id: `existing-${index}`,
      type: 'existing' as const,
      url,
      isPrimary: url === primaryImage
    })),
    ...uploadQueue
      .filter(item => item.status !== 'deleted' && (item.finalUrl || item.blobUrl))
      .map((item) => ({
        id: item.id,
        type: 'uploading' as const,
        url: item.finalUrl || item.blobUrl!,
        status: item.status,
        progress: item.progress,
        error: item.error,
        isPrimary: false
      }))
  ];

  const handleDelete = (url: string) => {
    console.log('🎯 OrderImageGallery delete called for:', url);
    onDelete(url);
  };

  const handleSetPrimary = (url: string) => {
    if (onSetPrimary) {
      onSetPrimary(url);
    }
  };

  if (allItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Нет загруженных изображений</p>
        <p className="text-sm mt-1">Загрузите до {maxImages} фотографий</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Изображения заказа ({allItems.length}/{maxImages})</h4>
        {primaryImage && (
          <Badge variant="success" className="text-xs">
            <Star className="h-3 w-3 mr-1" />
            Главное изображение установлено
          </Badge>
        )}
      </div>

      {/* Image grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {allItems.map((item) => (
          <div key={item.id} className="relative group">
            <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
              <img
                src={item.url}
                alt="Order image"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Primary indicator */}
              {item.isPrimary && (
                <div className="absolute top-1 left-1">
                  <Badge className="text-xs bg-yellow-500">
                    <Star className="h-2 w-2" />
                  </Badge>
                </div>
              )}

              {/* Upload status indicator */}
              {item.type === 'uploading' && (
                <div className="absolute top-1 right-1">
                  {item.status === 'success' && (
                    <Badge variant="success" className="text-xs">✓</Badge>
                  )}
                  {item.status === 'error' && (
                    <Badge variant="destructive" className="text-xs">✗</Badge>
                  )}
                  {(item.status === 'compressing' || item.status === 'uploading') && (
                    <Badge variant="secondary" className="text-xs">
                      <Loader2 className="h-2 w-2 animate-spin" />
                    </Badge>
                  )}
                </div>
              )}

              {/* Upload progress */}
              {item.type === 'uploading' && 
               (item.status === 'compressing' || item.status === 'uploading') && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                  <div className="flex items-center justify-between">
                    <span>
                      {item.status === 'compressing' ? 'Сжатие...' : 'Загрузка...'}
                    </span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className={cn(
                "absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-1",
                "opacity-0 group-hover:opacity-100"
              )}>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedPreview(item.url)}
                  className="h-6 w-6 p-0"
                  title="Посмотреть"
                >
                  <Eye className="h-3 w-3" />
                </Button>
                
                {onSetPrimary && !item.isPrimary && item.type === 'existing' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleSetPrimary(item.url)}
                    className="h-6 w-6 p-0"
                    title="Сделать главным"
                  >
                    <StarOff className="h-3 w-3" />
                  </Button>
                )}
                
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(item.url)}
                  className="h-6 w-6 p-0"
                  title="Удалить"
                  disabled={disabled || (item.type === 'uploading' && item.status !== 'success')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Error display */}
              {item.type === 'uploading' && item.status === 'error' && (
                <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                  <p className="truncate">{item.error}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview modal */}
      {selectedPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPreview(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelectedPreview(null)}
              className="absolute top-2 right-2 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
            <img
              src={selectedPreview}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderImageGallery;
