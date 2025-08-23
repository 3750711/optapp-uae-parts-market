import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Upload, X, Loader2, Play, Film } from 'lucide-react';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { cn } from '@/lib/utils';
import { UploadProgressCard } from '@/components/ui/image-upload/UploadProgressCard';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

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
  buttonText = "Upload Videos",
  buttonIcon = <Video className="h-4 w-4" />,
  className,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { uploadMultipleVideos, isUploading, uploadProgress, clearProgress } = useCloudinaryVideoUpload();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getSellerPagesTranslations(language);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || isUploading) return;

    // Синхронизированные лимиты с функцией загрузки
    const MAX_VIDEO_SIZE_MB = 20; // Синхронизировано с функцией
    const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov'];
    
    const files = Array.from(e.target.files);
    if (videos.length + files.length > maxVideos) {
      toast({
        title: t.videoUpload.limitExceeded,
        description: `${t.videoUpload.limitExceededMessage}: ${maxVideos}`,
        variant: "destructive",
      });
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const fileType = file.type.toLowerCase();
      // Handle .mov files which sometimes have type 'video/quicktime'
      const isAllowed = ALLOWED_VIDEO_TYPES.includes(fileType) || (file.name.toLowerCase().endsWith('.mov') && fileType === 'video/quicktime');
      
      if (!isAllowed) {
        toast({
          title: t.videoUpload.invalidFileFormat,
          description: `"${file.name}" ${t.videoUpload.invalidFileFormatMessage}.`,
          variant: "destructive",
        });
        continue;
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        toast({
          title: t.videoUpload.fileTooLarge,
          description: `"${file.name}" ${t.videoUpload.fileTooLargeMessage} ${MAX_VIDEO_SIZE_MB}${t.videoUpload.maxFileSize}.`,
          variant: "destructive",
        });
        continue;
      }
      validFiles.push(file);
    }
    
    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    console.log('📹 Starting Cloudinary video upload for files:', validFiles.map(f => f.name));
    
    const uploadedUrls = await uploadMultipleVideos(validFiles, productId);
    
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
          {isUploading ? t.videoUpload.uploadingToCloudinary : buttonText}
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
                <span className="text-xs text-gray-500">{t.videoUpload.uploadingToCloudinary}</span>
              </div>
            ) : (
              <>
                <div className="text-2xl text-gray-400 font-bold">+</div>
                <p className="text-xs text-gray-500">{t.videoUpload.addVideo}</p>
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
        {t.videoUpload.supportedFormats.replace('{maxVideos}', maxVideos.toString())}
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
              {t.videoUpload.uploadingToCloudinary}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t.videoUpload.chooseVideos}
            </>
          )}
        </Button>
      )}
    </div>
  );
};
