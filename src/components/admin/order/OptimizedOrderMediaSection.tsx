
import React, { useCallback, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, Video, X, Loader, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOptimizedOrderMediaUpload } from "@/hooks/useOptimizedOrderMediaUpload";
import OrderImageGallery from "@/components/ui/order-image-gallery/OrderImageGallery";

interface OptimizedOrderMediaSectionProps {
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  onVideoDelete: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  orderId?: string;
  disabled?: boolean;
  maxImages?: number;
  maxVideos?: number;
}

const OptimizedOrderMediaSection: React.FC<OptimizedOrderMediaSectionProps> = ({
  images,
  videos,
  onImagesUpload,
  onVideoUpload,
  onImageDelete,
  onVideoDelete,
  onSetPrimaryImage,
  primaryImage,
  orderId,
  disabled = false,
  maxImages = 25,
  maxVideos = 3
}) => {
  const { 
    uploadOrderFiles, 
    uploadQueue, 
    isUploading, 
    cancelUpload, 
    markAsDeleted 
  } = useOptimizedOrderMediaUpload();
  
  const [fileInputKey, setFileInputKey] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  console.log('📊 OptimizedOrderMediaSection render:', { 
    imageCount: images.length, 
    videoCount: videos.length,
    orderId,
    isUploading
  });

  const totalMediaCount = images.length + videos.length;

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('📁 Files selected:', files.length);

    const fileArray = Array.from(files);
    
    // Validate image files
    const validImageFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        console.warn('⚠️ Skipping non-image file:', file.name);
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        console.warn('⚠️ Skipping oversized file:', file.name, 'Size:', file.size);
        return false;
      }
      return true;
    });

    if (validImageFiles.length === 0) {
      console.warn('⚠️ No valid image files selected');
      return;
    }

    // Check limits
    if (images.length + validImageFiles.length > maxImages) {
      console.warn(`⚠️ Image limit exceeded: trying to add ${validImageFiles.length}, current: ${images.length}, max: ${maxImages}`);
      return;
    }

    try {
      console.log('🚀 Starting upload of', validImageFiles.length, 'files');
      
      const uploadedUrls = await uploadOrderFiles(validImageFiles, {
        orderId,
        maxConcurrent: 1,
        disableToast: false,
        compressionOptions: {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1000,
          initialQuality: 0.8,
          fileType: 'image/webp'
        }
      });
      
      if (uploadedUrls.length > 0) {
        console.log('✅ New order images uploaded:', uploadedUrls);
        onImagesUpload(uploadedUrls);
      } else {
        console.warn('⚠️ No images were successfully uploaded');
      }
    } catch (error) {
      console.error('💥 Error uploading order files:', error);
    }
    
    // Reset input
    setFileInputKey(prev => prev + 1);
  }, [uploadOrderFiles, orderId, onImagesUpload, images.length, maxImages]);

  const handleImageDelete = useCallback(async (url: string) => {
    console.log('🎯 handleImageDelete called for order image:', url);
    
    if (!url || !images.includes(url)) {
      console.warn('⚠️ Invalid image URL for deletion:', url);
      return;
    }
    
    try {
      // 1. Mark as deleted in upload queue
      markAsDeleted(url);
      
      // 2. Update UI immediately
      const newImageUrls = images.filter(imgUrl => imgUrl !== url);
      console.log('📱 Updating order images UI immediately:', { 
        before: images.length, 
        after: newImageUrls.length 
      });
      
      // 3. If deleting primary image and others exist, set new primary
      if (primaryImage === url && newImageUrls.length > 0 && onSetPrimaryImage) {
        console.log('🔄 Setting new primary image for order:', newImageUrls[0]);
        onSetPrimaryImage(newImageUrls[0]);
      }
      
      onImagesUpload(newImageUrls);
      
      // 4. Backend deletion (if implemented)
      if (onImageDelete) {
        onImageDelete(url);
      }
      
      console.log('✅ Order image removal completed');
    } catch (error) {
      console.error('❌ Error during order image deletion:', error);
    }
  }, [images, onImagesUpload, markAsDeleted, primaryImage, onSetPrimaryImage, onImageDelete]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled || isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      
      if (imageFiles.length > 0) {
        const imageFileList = new DataTransfer();
        imageFiles.forEach(file => imageFileList.items.add(file));
        handleFileSelect({ target: { files: imageFileList.files } } as any);
      }
    }
  }, [disabled, isUploading, handleFileSelect]);

  // Get failed uploads for display
  const failedUploads = uploadQueue.filter(item => item.status === 'error');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Медиафайлы заказа</Label>
        <div className="text-sm text-gray-600">
          📁 Всего: {totalMediaCount} (📸 {images.length}/{maxImages}, 🎥 {videos.length}/{maxVideos})
        </div>
      </div>

      {/* Upload buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="font-medium">Фотографии</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('order-image-input')?.click()}
                disabled={disabled || isUploading || images.length >= maxImages}
                className="w-full"
              >
                {isUploading ? (
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Загрузить фото
              </Button>
              <p className="text-xs text-gray-500">
                Максимум {maxImages} изображений, до 50MB каждое
              </p>
              <p className="text-xs text-green-600 font-medium">
                ✨ Автоматическое сжатие для ускорения загрузки
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span className="font-medium">Видео</span>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={disabled || videos.length >= maxVideos}
                className="w-full"
              >
                <Video className="mr-2 h-4 w-4" />
                Загрузить видео
              </Button>
              <p className="text-xs text-gray-500">
                Максимум {maxVideos} видео, до 100MB каждое
              </p>
              <p className="text-xs text-blue-600 font-medium">
                🎬 Поддержка MP4, MOV, AVI
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden file input */}
      <input
        key={fileInputKey}
        id="order-image-input"
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Upload progress */}
      {isUploading && uploadQueue.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Загрузка и обработка файлов</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={cancelUpload}
                >
                  Отменить
                </Button>
              </div>
              {uploadQueue.filter(item => item.status !== 'deleted').map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{item.file.name}</span>
                    <div className="flex items-center gap-2">
                      {item.status === 'compressing' && (
                        <span className="text-blue-600">Сжатие...</span>
                      )}
                      {item.status === 'uploading' && (
                        <span className="text-orange-600">Загрузка...</span>
                      )}
                      {item.status === 'success' && (
                        <span className="text-green-600">Готово</span>
                      )}
                      {item.status === 'error' && (
                        <span className="text-red-600">Ошибка</span>
                      )}
                      <span>{item.progress}%</span>
                    </div>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  {item.status === 'success' && (
                    <p className="text-xs text-green-600">
                      ✅ Файл успешно обработан и загружен
                    </p>
                  )}
                  {item.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <p className="text-xs text-red-600">
                        {item.error || 'Неизвестная ошибка'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed uploads summary */}
      {failedUploads.length > 0 && !isUploading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">
                Ошибки загрузки ({failedUploads.length} файлов)
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {failedUploads.map(item => (
                <p key={item.id} className="text-sm text-red-600">
                  • {item.file.name}: {item.error}
                </p>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                // Retry failed uploads
                const filesToRetry = failedUploads.map(item => item.file);
                if (filesToRetry.length > 0) {
                  handleFileSelect({ target: { files: filesToRetry } } as any);
                }
              }}
            >
              Повторить загрузку
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Drag & Drop zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          Перетащите изображения сюда или используйте кнопки выше
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Поддерживаются JPEG, PNG, WebP до 50MB
        </p>
      </div>

      {/* Order Image Gallery */}
      <OrderImageGallery
        images={images}
        uploadQueue={uploadQueue}
        primaryImage={primaryImage}
        onSetPrimary={onSetPrimaryImage}
        onDelete={handleImageDelete}
        disabled={disabled}
        maxImages={maxImages}
      />

      {/* Video Gallery */}
      {videos.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium">Загруженные видео ({videos.length})</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videos.map((url, index) => (
              <div key={`video-${index}`} className="relative aspect-square rounded-lg overflow-hidden border">
                <video 
                  src={url} 
                  className="w-full h-full object-cover"
                  preload="metadata"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Видео
                </div>
                <button
                  type="button"
                  onClick={() => onVideoDelete(url)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OptimizedOrderMediaSection;
