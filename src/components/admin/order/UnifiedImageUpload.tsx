
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, X, Eye } from "lucide-react";
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from "@/lib/utils";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  blobUrl?: string;
  finalUrl?: string;
}

interface UnifiedImageUploadProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

const UnifiedImageUpload: React.FC<UnifiedImageUploadProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  disabled = false,
  maxImages = 25
}) => {
  const { uploadFiles, isUploading } = useCloudinaryUpload();
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  const cleanupUploadItem = useCallback((itemId: string) => {
    setUploadQueue(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item?.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
      return prev.filter(i => i.id !== itemId);
    });
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    const newItems: UploadItem[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: URL.createObjectURL(file)
    }));

    setUploadQueue(prev => [...prev, ...newItems]);

    try {
      const uploadedUrls = await uploadFiles(fileArray);
      
      if (uploadedUrls.length > 0) {
        onImagesUpload([...images, ...uploadedUrls]);
        
        // Очищаем успешно загруженные элементы сразу
        newItems.forEach(item => {
          cleanupUploadItem(item.id);
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
    }

    event.target.value = '';
  }, [uploadFiles, images, onImagesUpload, cleanupUploadItem]);

  const handleDelete = useCallback((url: string) => {
    console.log('🗑️ Deleting image:', url);
    
    const isExistingImage = images.includes(url);
    const queueItem = uploadQueue.find(item => item.finalUrl === url || item.blobUrl === url);
    
    if (isExistingImage) {
      const newImages = images.filter(img => img !== url);
      onImagesUpload(newImages);
      if (onImageDelete) {
        onImageDelete(url);
      }
    }
    
    if (queueItem) {
      cleanupUploadItem(queueItem.id);
    }
  }, [images, uploadQueue, onImagesUpload, onImageDelete, cleanupUploadItem]);

  // Показываем только существующие изображения и активные загрузки (не успешные)
  const allItems = [
    // Загруженные изображения
    ...images.map((url, index) => ({
      id: `existing-${index}`,
      type: 'existing' as const,
      url
    })),
    // Только активные загрузки (pending, uploading, processing, error) - НЕ success
    ...uploadQueue
      .filter(item => 
        item.status !== 'success' && 
        item.blobUrl && 
        (item.status === 'pending' || item.status === 'uploading' || item.status === 'processing' || item.status === 'error')
      )
      .map((item) => ({
        id: item.id,
        type: 'uploading' as const,
        url: item.blobUrl!,
        status: item.status,
        progress: item.progress,
        error: item.error
      }))
  ];

  const canUploadMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('unified-image-input')?.click()}
        disabled={disabled || isUploading || !canUploadMore}
        className="w-full"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Загрузить фото ({images.length}/{maxImages})
          </>
        )}
      </Button>
      
      <input
        id="unified-image-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Image Gallery */}
      {allItems.length > 0 ? (
        <div className="space-y-4">
          <h4 className="font-medium">Изображения ({allItems.length}/{maxImages})</h4>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allItems.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-gray-100">
                  <img
                    src={item.url}
                    alt="Image"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Upload status */}
                  {item.type === 'uploading' && (
                    <div className="absolute top-1 right-1">
                      {item.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">✗</Badge>
                      )}
                      {(item.status === 'pending' || item.status === 'uploading' || item.status === 'processing') && (
                        <Badge variant="secondary" className="text-xs">
                          <Loader2 className="h-2 w-2 animate-spin" />
                        </Badge>
                      )}
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
                    
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.url)}
                      className="h-6 w-6 p-0"
                      title="Удалить"
                      disabled={disabled || (item.type === 'uploading' && item.status === 'uploading')}
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
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>Нет загруженных изображений</p>
          <p className="text-sm mt-1">Загрузите до {maxImages} фотографий</p>
        </div>
      )}

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

export default UnifiedImageUpload;
