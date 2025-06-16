
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Video, Loader2 } from "lucide-react";
import { useSimpleOrderUpload } from '@/hooks/useSimpleOrderUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { Badge } from "@/components/ui/badge";

interface MediaItem {
  id: string;
  url?: string;
  file?: File;
  type: 'image' | 'video';
  status: 'uploaded' | 'waiting' | 'uploading' | 'error';
  progress: number;
  error?: string;
  blobUrl?: string;
  isMainImage?: boolean;
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
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  // Initialize media items from existing images
  React.useEffect(() => {
    const existingItems: MediaItem[] = images.map((url, index) => ({
      id: `existing-${index}`,
      url,
      type: 'image' as const,
      status: 'uploaded' as const,
      progress: 100,
      isMainImage: index === 0
    }));
    setMediaItems(existingItems);
  }, [images]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Create new media items for uploading files
    const newItems: MediaItem[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: 'image',
      status: 'waiting',
      progress: 0,
      blobUrl: URL.createObjectURL(file)
    }));

    // Add new items to the list
    setMediaItems(prev => [...prev, ...newItems]);

    // Start uploading each file
    for (const item of newItems) {
      setMediaItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 25 } : i)
      );

      try {
        const uploadedUrls = await uploadFiles([item.file!]);
        
        if (uploadedUrls.length > 0) {
          // Update item with uploaded URL
          setMediaItems(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'uploaded', 
              progress: 100, 
              url: uploadedUrls[0],
              file: undefined,
              blobUrl: undefined
            } : i)
          );
          
          // ИСПРАВЛЕНИЕ: Добавляем новые URL к существующим, а не заменяем
          onImagesUpload([...images, ...uploadedUrls]);
        } else {
          setMediaItems(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'error', 
              progress: 0,
              error: 'Ошибка загрузки'
            } : i)
          );
        }
      } catch (error) {
        setMediaItems(prev => 
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
  }, [uploadFiles, images, onImagesUpload]);

  const handleVideoSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Create new media item for video
    const newItem: MediaItem = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: 'video',
      status: 'waiting',
      progress: 0,
      blobUrl: URL.createObjectURL(file)
    };

    setMediaItems(prev => [...prev, newItem]);

    // Start uploading
    setMediaItems(prev => 
      prev.map(i => i.id === newItem.id ? { ...i, status: 'uploading', progress: 25 } : i)
    );

    try {
      const result = await uploadVideo(file);
      
      if (result.success && result.cloudinaryUrl) {
        setMediaItems(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'uploaded', 
            progress: 100, 
            url: result.cloudinaryUrl,
            file: undefined,
            blobUrl: undefined
          } : i)
        );
      } else {
        setMediaItems(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'error', 
            progress: 0,
            error: result.error || 'Ошибка загрузки видео'
          } : i)
        );
      }
    } catch (error) {
      setMediaItems(prev => 
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
  }, [uploadVideo]);

  const handleItemDelete = useCallback((id: string) => {
    const item = mediaItems.find(i => i.id === id);
    if (!item) return;

    if (item.type === 'image' && item.status === 'uploaded' && item.url) {
      // Remove from parent component
      const newImages = images.filter(img => img !== item.url);
      onImagesUpload(newImages);
      if (onImageDelete) {
        onImageDelete(item.url);
      }
    }

    // Clean up blob URL if exists
    if (item.blobUrl) {
      URL.revokeObjectURL(item.blobUrl);
    }

    // Remove from local state
    setMediaItems(prev => prev.filter(i => i.id !== id));
  }, [mediaItems, images, onImagesUpload, onImageDelete]);

  const getStatusBadge = (status: MediaItem['status']) => {
    switch (status) {
      case 'waiting':
        return <Badge variant="secondary" className="text-xs">Ожидает</Badge>;
      case 'uploading':
        return <Badge variant="secondary" className="text-xs">Загружается</Badge>;
      case 'uploaded':
        return <Badge variant="default" className="text-xs bg-green-500">Загружен</Badge>;
      case 'error':
        return <Badge variant="destructive" className="text-xs">Ошибка</Badge>;
    }
  };

  const getImageSource = (item: MediaItem) => {
    if (item.status === 'uploaded' && item.url) {
      return item.url;
    }
    if (item.blobUrl) {
      return item.blobUrl;
    }
    return '';
  };

  const uploadedImagesCount = mediaItems.filter(item => item.type === 'image' && item.status === 'uploaded').length;

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('simple-image-input')?.click()}
          disabled={disabled || isUploading || uploadedImagesCount >= maxImages}
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

      {/* Media Gallery */}
      {mediaItems.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm">
            Медиафайлы ({uploadedImagesCount}/{maxImages}):
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mediaItems.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                {item.type === 'image' ? (
                  <img
                    src={getImageSource(item)}
                    alt="Медиафайл"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={getImageSource(item)}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                
                {/* Status badge */}
                <div className="absolute top-1 left-1">
                  {getStatusBadge(item.status)}
                </div>

                {/* Main image badge */}
                {item.isMainImage && (
                  <div className="absolute top-1 right-8 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Главное
                  </div>
                )}

                {/* Progress bar for uploading */}
                {item.status === 'uploading' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1">
                    <div className="flex items-center justify-between">
                      <span>Загрузка...</span>
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

                {/* Error message */}
                {item.status === 'error' && item.error && (
                  <div className="absolute bottom-0 left-0 right-0 bg-red-500 text-white text-xs p-1">
                    <p className="truncate">{item.error}</p>
                  </div>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleItemDelete(item.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMediaSection;
