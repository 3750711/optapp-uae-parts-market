
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Video, Loader2, X, Star, StarOff, Eye } from "lucide-react";
import { useSimpleOrderUpload } from '@/hooks/useSimpleOrderUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
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

interface SimpleMediaSectionProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

const SimpleMediaSection: React.FC<SimpleMediaSectionProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  disabled = false,
  maxImages = 25
}) => {
  const { uploadFiles, isUploading } = useSimpleOrderUpload();
  const { uploadVideo, isUploading: isVideoUploading } = useCloudinaryVideoUpload();
  const [uploadQueue, setUploadQueue] = useState<OrderUploadItem[]>([]);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);

  // Функция для очистки blob URL и удаления элементов из очереди
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
    
    // Create new upload items
    const newItems: OrderUploadItem[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: URL.createObjectURL(file),
      originalSize: file.size
    }));

    // Add to upload queue
    setUploadQueue(prev => [...prev, ...newItems]);

    // Start uploading each file
    for (const item of newItems) {
      setUploadQueue(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 25 } : i)
      );

      try {
        const uploadedUrls = await uploadFiles([item.file]);
        
        if (uploadedUrls.length > 0) {
          // Update item with uploaded URL
          setUploadQueue(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'success', 
              progress: 100, 
              finalUrl: uploadedUrls[0]
            } : i)
          );
          
          // ИСПРАВЛЕНО: Добавляем новые URL к существующим изображениям
          onImagesUpload([...images, ...uploadedUrls]);

          // Автоматически очищаем успешно загруженный элемент через короткое время
          setTimeout(() => {
            cleanupUploadItem(item.id);
          }, 1000);
        } else {
          setUploadQueue(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'error', 
              progress: 0,
              error: 'Ошибка загрузки'
            } : i)
          );
        }
      } catch (error) {
        setUploadQueue(prev => 
          prev.map(i => i.id === item.id ? { 
            ...i, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : 'Ошибка загрузки'
          } : i)
        );
      }
    }

    // Reset input
    event.target.value = '';
  }, [uploadFiles, images, onImagesUpload, cleanupUploadItem]);

  const handleVideoSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Create new upload item for video
    const newItem: OrderUploadItem = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: URL.createObjectURL(file),
      originalSize: file.size
    };

    setUploadQueue(prev => [...prev, newItem]);

    // Start uploading
    setUploadQueue(prev => 
      prev.map(i => i.id === newItem.id ? { ...i, status: 'uploading', progress: 25 } : i)
    );

    try {
      const result = await uploadVideo(file);
      
      if (result.success && result.cloudinaryUrl) {
        setUploadQueue(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'success', 
            progress: 100, 
            finalUrl: result.cloudinaryUrl
          } : i)
        );

        // Автоматически очищаем успешно загруженное видео
        setTimeout(() => {
          cleanupUploadItem(newItem.id);
        }, 1000);
      } else {
        setUploadQueue(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'error', 
            progress: 0,
            error: result.error || 'Ошибка загрузки видео'
          } : i)
        );
      }
    } catch (error) {
      setUploadQueue(prev => 
        prev.map(i => i.id === newItem.id ? { 
          ...i, 
          status: 'error', 
          progress: 0,
          error: error instanceof Error ? error.message : 'Ошибка загрузки видео'
        } : i)
      );
    }

    // Reset input
    event.target.value = '';
  }, [uploadVideo, cleanupUploadItem]);

  const handleDelete = useCallback((url: string) => {
    console.log('🗑️ SimpleMediaSection: Deleting image:', url);
    
    // Check if it's an existing image or upload queue item
    const isExistingImage = images.includes(url);
    const queueItem = uploadQueue.find(item => item.finalUrl === url || item.blobUrl === url);
    
    if (isExistingImage) {
      // Remove from existing images
      const newImages = images.filter(img => img !== url);
      onImagesUpload(newImages);
      if (onImageDelete) {
        onImageDelete(url);
      }
    }
    
    if (queueItem) {
      // Clean up and remove from queue
      cleanupUploadItem(queueItem.id);
    }
  }, [images, uploadQueue, onImagesUpload, onImageDelete, cleanupUploadItem]);

  // Combine existing images with ONLY uploading/pending/error items from upload queue
  // Exclude 'success' items to prevent duplication since they're already in images array
  const allItems = [
    ...images.map((url, index) => ({
      id: `existing-${index}`,
      type: 'existing' as const,
      url,
      isPrimary: false
    })),
    ...uploadQueue
      .filter(item => 
        item.status !== 'deleted' && 
        item.status !== 'success' && // Исключаем успешные загрузки
        (item.blobUrl || item.finalUrl)
      )
      .map((item) => ({
        id: item.id,
        type: 'uploading' as const,
        url: item.blobUrl || item.finalUrl!,
        status: item.status,
        progress: item.progress,
        error: item.error,
        isPrimary: false
      }))
  ];

  const uploadedImagesCount = images.length;
  const canUploadMore = uploadedImagesCount < maxImages;

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('simple-image-input')?.click()}
          disabled={disabled || isUploading || !canUploadMore}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Загрузить фото
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('simple-video-input')?.click()}
          disabled={disabled || isVideoUploading}
          className="flex-1"
        >
          {isVideoUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Загрузка...
            </>
          ) : (
            <>
              <Video className="mr-2 h-4 w-4" />
              Загрузить видео
            </>
          )}
        </Button>
      </div>
      
      <input
        id="simple-image-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <input
        id="simple-video-input"
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
        disabled={disabled || isVideoUploading}
      />

      {/* Image Gallery */}
      {allItems.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Изображения заказа ({allItems.length}/{maxImages})</h4>
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

                  {/* Upload status indicator - только для загружающихся элементов */}
                  {item.type === 'uploading' && (
                    <div className="absolute top-1 right-1">
                      {item.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">✗</Badge>
                      )}
                      {(item.status === 'pending' || item.status === 'compressing' || item.status === 'uploading') && (
                        <Badge variant="secondary" className="text-xs">
                          <Loader2 className="h-2 w-2 animate-spin" />
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Upload progress - только для активно загружающихся */}
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

export default SimpleMediaSection;
