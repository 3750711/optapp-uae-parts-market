
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, X, Video, Loader2 } from "lucide-react";
import { useSimpleOrderUpload } from '@/hooks/useSimpleOrderUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { Badge } from "@/components/ui/badge";

interface UploadItem {
  id: string;
  file: File;
  type: 'image' | 'video';
  status: 'waiting' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  url?: string;
  error?: string;
  blobUrl: string;
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
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Create upload items with preview
    const newItems: UploadItem[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: 'image',
      status: 'waiting',
      progress: 0,
      blobUrl: URL.createObjectURL(file)
    }));

    setUploadItems(prev => [...prev, ...newItems]);

    // Start uploading
    for (const item of newItems) {
      setUploadItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 25 } : i)
      );

      try {
        const uploadedUrls = await uploadFiles([item.file]);
        
        if (uploadedUrls.length > 0) {
          setUploadItems(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'uploaded', 
              progress: 100, 
              url: uploadedUrls[0] 
            } : i)
          );
          
          onImagesUpload([...images, ...uploadedUrls]);
        } else {
          setUploadItems(prev => 
            prev.map(i => i.id === item.id ? { 
              ...i, 
              status: 'error', 
              progress: 0,
              error: 'Ошибка загрузки'
            } : i)
          );
        }
      } catch (error) {
        setUploadItems(prev => 
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
    
    // Create upload item with preview
    const newItem: UploadItem = {
      id: `${Date.now()}-${Math.random()}`,
      file,
      type: 'video',
      status: 'waiting',
      progress: 0,
      blobUrl: URL.createObjectURL(file)
    };

    setUploadItems(prev => [...prev, newItem]);

    // Start uploading
    setUploadItems(prev => 
      prev.map(i => i.id === newItem.id ? { ...i, status: 'uploading', progress: 25 } : i)
    );

    try {
      const result = await uploadVideo(file);
      
      if (result.success && result.cloudinaryUrl) {
        setUploadItems(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'uploaded', 
            progress: 100, 
            url: result.cloudinaryUrl 
          } : i)
        );
      } else {
        setUploadItems(prev => 
          prev.map(i => i.id === newItem.id ? { 
            ...i, 
            status: 'error', 
            progress: 0,
            error: result.error || 'Ошибка загрузки видео'
          } : i)
        );
      }
    } catch (error) {
      setUploadItems(prev => 
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

  const handleImageDelete = useCallback((url: string) => {
    const newImages = images.filter(img => img !== url);
    onImagesUpload(newImages);
    if (onImageDelete) {
      onImageDelete(url);
    }
  }, [images, onImagesUpload, onImageDelete]);

  const handleUploadItemDelete = useCallback((id: string) => {
    setUploadItems(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.blobUrl) {
        URL.revokeObjectURL(item.blobUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const getStatusBadge = (status: UploadItem['status']) => {
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

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('simple-image-input')?.click()}
          disabled={disabled || isUploading || images.length >= maxImages}
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

      {/* Upload Items Preview */}
      {uploadItems.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Загружаемые файлы:</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadItems.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                {item.type === 'image' ? (
                  <img
                    src={item.blobUrl}
                    alt="Предпросмотр"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={item.blobUrl}
                    className="w-full h-full object-cover"
                    muted
                  />
                )}
                
                {/* Status badge */}
                <div className="absolute top-1 left-1">
                  {getStatusBadge(item.status)}
                </div>

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
                  onClick={() => handleUploadItemDelete(item.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Images Gallery */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Загруженные изображения ({images.length}/{maxImages}):</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                <img
                  src={url}
                  alt={`Изображение ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleImageDelete(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {index === 0 && (
                  <div className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
                    Главное
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleMediaSection;
