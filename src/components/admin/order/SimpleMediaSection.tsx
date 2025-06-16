
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Video, Loader2 } from "lucide-react";
import { useSimpleOrderUpload } from '@/hooks/useSimpleOrderUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import OrderImageGallery from '@/components/ui/order-image-gallery/OrderImageGallery';

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
          
          // Add new URL to existing images
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
      <OrderImageGallery
        images={images}
        uploadQueue={uploadQueue}
        onDelete={handleDelete}
        disabled={disabled}
        maxImages={maxImages}
      />
    </div>
  );
};

export default SimpleMediaSection;
