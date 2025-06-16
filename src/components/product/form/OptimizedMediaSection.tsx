
import React, { useCallback, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Video, X } from "lucide-react";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import { useImageDeletionState } from "@/hooks/useImageDeletionState";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";

interface OptimizedMediaSectionProps {
  imageUrls: string[];
  videoUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
  disabled?: boolean;
}

const OptimizedMediaSection: React.FC<OptimizedMediaSectionProps> = ({
  imageUrls,
  videoUrls,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId,
  disabled = false
}) => {
  const { uploadFiles, uploadQueue, isUploading, cancelUpload, markAsDeleted } = useOptimizedImageUpload();
  const [fileInputKey, setFileInputKey] = useState(0);

  console.log('📊 OptimizedMediaSection render:', { 
    imageCount: imageUrls.length, 
    imageUrls: imageUrls.slice(0, 3) 
  });

  // Простое удаление изображений
  const { deleteImage } = useImageDeletionState({
    onConfirmDelete: async (url: string) => {
      console.log('🔄 Backend deletion for:', url);
      if (onImageDelete) {
        await onImageDelete(url);
        console.log('✅ Backend deletion completed for:', url);
      }
    }
  });

  const totalMediaCount = imageUrls.length + videoUrls.length;

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Валидация файлов
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        return false;
      }
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const getCompressionOptions = (file: File) => {
        const isLargeFile = file.size > 10 * 1024 * 1024; // >10MB
        
        return {
          maxSizeMB: isLargeFile ? 0.3 : 0.8,
          maxWidthOrHeight: isLargeFile ? 600 : 1000,
          initialQuality: isLargeFile ? 0.6 : 0.8,
          fileType: 'image/webp'
        };
      };

      const uploadedUrls = await uploadFiles(validFiles, {
        productId,
        maxConcurrent: 1,
        disableToast: false,
        compressionOptions: getCompressionOptions(validFiles[0])
      });
      
      if (uploadedUrls.length > 0) {
        console.log('📸 New images uploaded:', uploadedUrls);
        handleMobileOptimizedImageUpload(uploadedUrls);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    
    // Сброс input
    setFileInputKey(prev => prev + 1);
  }, [uploadFiles, productId, handleMobileOptimizedImageUpload]);

  // Упрощенный обработчик удаления без блокировок
  const handleImageDelete = useCallback(async (url: string) => {
    console.log('🎯 handleImageDelete called for:', url);
    
    if (!url || !imageUrls.includes(url)) {
      console.warn('⚠️ Invalid image URL for deletion:', url);
      return;
    }
    
    try {
      // 1. Мгновенно помечаем в очереди загрузки как удаленное
      markAsDeleted(url);
      
      // 2. Мгновенно обновляем UI - убираем изображение из списка
      const newImageUrls = imageUrls.filter(imgUrl => imgUrl !== url);
      console.log('📱 Updating UI immediately:', { 
        before: imageUrls.length, 
        after: newImageUrls.length 
      });
      
      // 3. Если удаляется главное изображение и остаются другие, назначаем новое главное
      if (primaryImage === url && newImageUrls.length > 0 && onSetPrimaryImage) {
        console.log('🔄 Setting new primary image:', newImageUrls[0]);
        onSetPrimaryImage(newImageUrls[0]);
      }
      
      handleMobileOptimizedImageUpload(newImageUrls);
      
      // 4. Асинхронно выполняем удаление на бэкенде (не блокируем UI)
      deleteImage(url).catch(error => {
        console.error('❌ Backend deletion failed:', error);
        // В случае ошибки можно показать toast, но не возвращать изображение
      });
      
      console.log('✅ Image removal completed');
    } catch (error) {
      console.error('❌ Error during deletion:', error);
    }
  }, [imageUrls, handleMobileOptimizedImageUpload, deleteImage, markAsDeleted, primaryImage, onSetPrimaryImage]);

  const handleVideoUpload = (urls: string[]) => {
    setVideoUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete));
  };

  return (
    <div className="space-y-6">
      {/* Кнопки загрузки */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            disabled={disabled || isUploading || imageUrls.length >= 30}
            onClick={() => document.getElementById('optimized-image-input')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Загрузка...' : 'Загрузить фото'}
          </Button>
          <input
            key={fileInputKey}
            id="optimized-image-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </div>
        
        <div className="flex-1">
          <CloudinaryVideoUpload
            videos={videoUrls}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            maxVideos={2}
            productId={productId}
            showOnlyButton={true}
            buttonText="Загрузить видео"
            buttonIcon={<Video className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Кнопка отмены загрузки */}
      {isUploading && (
        <Button
          type="button"
          variant="destructive"
          onClick={cancelUpload}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Отменить загрузку
        </Button>
      )}

      {/* Счетчик медиафайлов */}
      {totalMediaCount > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              📁 Медиафайлов: {totalMediaCount} (📸 Фото: {imageUrls.length}/30, 🎥 Видео: {videoUrls.length}/2)
            </span>
          </div>
        </div>
      )}

      {/* Оптимизированная галерея изображений */}
      <OptimizedImageGallery
        images={imageUrls}
        uploadQueue={uploadQueue}
        primaryImage={primaryImage}
        onSetPrimary={onSetPrimaryImage}
        onDelete={handleImageDelete}
        disabled={disabled}
      />

      {/* Галерея видео */}
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные видео</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {videoUrls.map((url, index) => (
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
                  onClick={() => handleVideoDelete(url)}
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

export default OptimizedMediaSection;
