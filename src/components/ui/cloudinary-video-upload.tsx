import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Upload, X, Loader2, Play, Film } from 'lucide-react';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { cn } from '@/lib/utils';
import { UploadProgressCard } from '@/components/ui/image-upload/UploadProgressCard';

interface CloudinaryVideoUploadProps {
  videos: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxVideos?: number;
  productId?: string;
  showOnlyButton?: boolean;
  showGalleryOnly?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const CloudinaryVideoUpload: React.FC<CloudinaryVideoUploadProps> = ({
  videos,
  onUpload,
  onDelete,
  maxVideos = 3,
  productId,
  showOnlyButton = false,
  showGalleryOnly = false,
  buttonText = "Загрузить видео",
  buttonIcon = <Video className="h-4 w-4" />,
  className,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadMultipleVideos, isUploading, uploadProgress, clearProgress } = useCloudinaryVideoUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || isUploading) return;
    
    const files = Array.from(e.target.files);
    if (videos.length + files.length > maxVideos) {
      alert(`Максимальное количество видео: ${maxVideos}`);
      return;
    }

    console.log('📹 Starting Cloudinary video upload for files:', files.map(f => f.name));
    
    const uploadedUrls = await uploadMultipleVideos(files, productId);
    
    if (uploadedUrls.length > 0) {
      onUpload(uploadedUrls);
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChooseVideos = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Показывать только кнопку
  if (showOnlyButton) {
    return (
      <div className={cn("w-full space-y-4", className)}>
        <Button
          type="button"
          variant="outline"
          onClick={handleChooseVideos}
          disabled={disabled || isUploading || videos.length >= maxVideos}
          className="w-full h-12"
        >
          {isUploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            buttonIcon
          )}
          {isUploading ? 'Загрузка в Cloudinary...' : buttonText}
        </Button>
        
        <input
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={disabled || isUploading}
        />

        <UploadProgressCard
          uploadProgress={uploadProgress}
          isUploading={isUploading}
          onClearProgress={clearProgress}
          formatFileSize={formatFileSize}
        />
      </div>
    );
  }

  // Показывать только галерею
  if (showGalleryOnly && videos.length > 0) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
        {videos.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs flex items-center gap-1">
              <Film className="w-3 h-3" />
              Cloudinary
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Полный компонент (по умолчанию)
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onDelete(url)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
              disabled={disabled}
            >
              <X size={16} />
            </button>
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs flex items-center gap-1">
              <Film className="w-3 h-3" />
              Cloudinary
            </div>
          </div>
        ))}
        
        {videos.length < maxVideos && (
          <div 
            className={cn(
              "border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center aspect-video",
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-gray-50"
            )}
            onClick={disabled ? undefined : handleChooseVideos}
          >
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin h-6 w-6 mb-2" />
                <span className="text-xs text-gray-500">Загрузка в Cloudinary...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl text-gray-400 font-bold">+</div>
                <p className="text-xs text-gray-500">Добавить видео</p>
              </>
            )}
          </div>
        )}
      </div>
      
      <input
        type="file"
        accept="video/*"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <UploadProgressCard
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        onClearProgress={clearProgress}
        formatFileSize={formatFileSize}
      />
      
      <p className="text-xs text-gray-500">
        ДО {maxVideos} роликов. Поддержка: mp4, mov, avi, webm. Загрузка через Cloudinary CDN.
      </p>
      
      {videos.length < maxVideos && (
        <Button
          type="button"
          variant="outline"
          onClick={handleChooseVideos}
          disabled={disabled || isUploading}
          className="flex items-center gap-2 mt-2 w-full md:w-auto"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка в Cloudinary...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Выбрать видео
            </>
          )}
        </Button>
      )}
    </div>
  );
};
