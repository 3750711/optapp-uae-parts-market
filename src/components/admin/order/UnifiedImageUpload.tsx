
import React, { useCallback, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, X, Eye, Minimize2 } from "lucide-react";
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from "@/lib/utils";
import imageCompression from 'browser-image-compression';

interface UploadItem {
  id: string;
  file: File;
  compressedFile?: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'processing' | 'success' | 'error';
  error?: string;
  blobUrl?: string;
  finalUrl?: string;
  originalSize?: number;
  compressedSize?: number;
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
  maxImages = 50
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

  // Функция сжатия изображения с динамическими настройками
  const compressImage = useCallback(async (file: File, itemId: string): Promise<File> => {
    const fileSizeMB = file.size / 1024 / 1024;
    
    // Динамические настройки сжатия в зависимости от размера файла
    let compressionOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
    };

    if (fileSizeMB > 10) {
      compressionOptions = {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1000,
        useWebWorker: true,
        initialQuality: 0.7,
      };
    } else if (fileSizeMB > 5) {
      compressionOptions = {
        maxSizeMB: 0.9,
        maxWidthOrHeight: 1100,
        useWebWorker: true,
        initialQuality: 0.75,
      };
    }

    try {
      console.log(`🗜️ Compressing image ${file.name}:`, {
        originalSize: fileSizeMB.toFixed(2) + 'MB',
        settings: compressionOptions
      });

      setUploadQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'compressing', progress: 20 }
          : item
      ));

      const compressedFile = await imageCompression(file, compressionOptions);
      
      const compressedSizeMB = compressedFile.size / 1024 / 1024;
      const compressionRatio = Math.round((1 - compressedFile.size / file.size) * 100);
      
      console.log(`✅ Compression completed for ${file.name}:`, {
        originalSize: fileSizeMB.toFixed(2) + 'MB',
        compressedSize: compressedSizeMB.toFixed(2) + 'MB',
        compressionRatio: compressionRatio + '%'
      });

      setUploadQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              compressedFile,
              compressedSize: compressedFile.size,
              status: 'pending',
              progress: 0
            }
          : item
      ));

      return compressedFile;
    } catch (error) {
      console.error(`❌ Compression failed for ${file.name}:`, error);
      
      setUploadQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'pending', progress: 0 }
          : item
      ));

      // Возвращаем оригинальный файл в случае ошибки сжатия
      return file;
    }
  }, []);

  // Функция загрузки одного файла
  const uploadSingleFile = useCallback(async (item: UploadItem): Promise<string | null> => {
    try {
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: 'uploading', progress: 10 }
          : i
      ));

      const fileToUpload = item.compressedFile || item.file;
      const uploadedUrls = await uploadFiles([fileToUpload]);

      if (uploadedUrls.length > 0) {
        const finalUrl = uploadedUrls[0];
        
        setUploadQueue(prev => prev.map(i => 
          i.id === item.id 
            ? { ...i, status: 'success', progress: 100, finalUrl }
            : i
        ));

        // Очищаем элемент через небольшую задержку
        setTimeout(() => {
          cleanupUploadItem(item.id);
        }, 2000);

        return finalUrl;
      } else {
        throw new Error('Upload failed - no URL returned');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setUploadQueue(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: 'error', error: errorMessage, progress: 0 }
          : i
      ));

      console.error(`❌ Upload failed for ${item.file.name}:`, error);
      return null;
    }
  }, [uploadFiles, cleanupUploadItem]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    const newItems: UploadItem[] = fileArray.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
      blobUrl: URL.createObjectURL(file),
      originalSize: file.size
    }));

    setUploadQueue(prev => [...prev, ...newItems]);

    try {
      const uploadedUrls: string[] = [];

      // Обрабатываем файлы по одному
      for (const item of newItems) {
        console.log(`📤 Processing file: ${item.file.name}`);
        
        // Этап 1: Сжатие
        const compressedFile = await compressImage(item.file, item.id);
        
        // Обновляем item с сжатым файлом
        const updatedItem = {
          ...item,
          compressedFile,
          compressedSize: compressedFile.size
        };

        // Этап 2: Загрузка
        const uploadedUrl = await uploadSingleFile(updatedItem);
        
        if (uploadedUrl) {
          uploadedUrls.push(uploadedUrl);
          
          // Сразу обновляем список изображений после каждой успешной загрузки
          onImagesUpload([...images, ...uploadedUrls]);
        }

        // Пауза между загрузками для избежания перегрузки
        if (newItems.indexOf(item) < newItems.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ All uploads completed. Total uploaded: ${uploadedUrls.length}`);
    } catch (error) {
      console.error('❌ Upload process error:', error);
    }

    event.target.value = '';
  }, [uploadFiles, images, onImagesUpload, cleanupUploadItem, compressImage, uploadSingleFile]);

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
    // Только активные загрузки (pending, compressing, uploading, processing, error) - НЕ success
    ...uploadQueue
      .filter(item => 
        item.status !== 'success' && 
        item.blobUrl && 
        ['pending', 'compressing', 'uploading', 'processing', 'error'].includes(item.status)
      )
      .map((item) => ({
        id: item.id,
        type: 'uploading' as const,
        url: item.blobUrl!,
        status: item.status,
        progress: item.progress,
        error: item.error,
        originalSize: item.originalSize,
        compressedSize: item.compressedSize
      }))
  ];

  const canUploadMore = images.length < maxImages;
  const hasActiveUploads = uploadQueue.some(item => 
    ['pending', 'compressing', 'uploading', 'processing'].includes(item.status)
  );

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <Button
        type="button"
        variant="outline"
        disabled={disabled || hasActiveUploads || !canUploadMore}
        className="w-full relative"
      >
        {hasActiveUploads ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Загрузка по одному...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Загрузить фото ({images.length}/{maxImages})
          </>
        )}
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="absolute inset-0 opacity-0 cursor-pointer"
          disabled={disabled || hasActiveUploads}
        />
      </Button>

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
                    className="w-full h-full object-contain bg-muted"
                    loading="lazy"
                  />

                  {/* Upload status */}
                  {item.type === 'uploading' && (
                    <div className="absolute top-1 right-1">
                      {item.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">✗</Badge>
                      )}
                      {item.status === 'compressing' && (
                        <Badge variant="secondary" className="text-xs">
                          <Minimize2 className="h-2 w-2 mr-1" />
                          Сжатие
                        </Badge>
                      )}
                      {(item.status === 'pending' || item.status === 'uploading' || item.status === 'processing') && (
                        <Badge variant="secondary" className="text-xs">
                          <Loader2 className="h-2 w-2 animate-spin" />
                          {item.status === 'uploading' ? 'Загрузка' : 'Ожидание'}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Compression info */}
                  {item.type === 'uploading' && item.originalSize && item.compressedSize && (
                    <div className="absolute bottom-1 left-1">
                      <Badge variant="outline" className="text-xs bg-white bg-opacity-90">
                        {Math.round((1 - item.compressedSize / item.originalSize) * 100)}%
                      </Badge>
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
                      disabled={disabled || (item.type === 'uploading' && ['compressing', 'uploading'].includes(item.status))}
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
