import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Upload, X, Loader2, Play, Pause, Plus } from 'lucide-react';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { isAllowedVideo, getFileValidationError, getVideoAcceptAttribute } from '@/utils/fileValidation';

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
  const { uploadMultipleVideos, isUploading, uploadProgress, clearProgress, pauseUpload, resumeUpload } = useCloudinaryVideoUpload();
  const { toast } = useToast();
  const { language } = useLanguage();
  const t = getSellerPagesTranslations(language);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || isUploading) return;

    const MAX_VIDEO_SIZE_MB = 20;
    const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
    
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
      if (!isAllowedVideo(file)) {
        toast({
          title: t.videoUpload.invalidFileFormat,
          description: getFileValidationError(file, 'video'),
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
      e.target.value = "";
      return;
    }

    console.log('📹 Starting Cloudinary video upload for files:', validFiles.map(f => f.name));
    
    const uploadedUrls = await uploadMultipleVideos(validFiles, productId);
    
    if (uploadedUrls.length > 0) {
      onUpload(uploadedUrls);
    }

    e.target.value = "";
  };

  // Compact Upload Progress Component
  const UploadProgress = () => (
    uploadProgress.length > 0 && (
      <div className="space-y-1">
        {uploadProgress.map((progress) => (
          <div key={progress.fileId} className="bg-muted/30 rounded p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs truncate flex-1 max-w-[160px] sm:max-w-[200px]">
                {progress.fileName}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {progress.status === 'uploading' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => pauseUpload(progress.fileId)}
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                )}
                {progress.status === 'paused' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0"
                    onClick={() => resumeUpload(progress.fileId)}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                <span className="text-xs text-muted-foreground text-right min-w-[30px]">
                  {progress.progress}%
                </span>
              </div>
            </div>
            
            <Progress value={progress.progress} className="h-1" />
            
            {progress.status === 'error' && (
              <p className="text-xs text-destructive mt-1 truncate">{progress.error}</p>
            )}
          </div>
        ))}
      </div>
    )
  );

  // Compact Video Gallery Component
  const VideoGallery = ({ showDelete = true }) => (
    videos.length > 0 && (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {videos.map((url, i) => (
          <div key={i} className="relative group bg-muted rounded overflow-hidden h-16 sm:h-20">
            <video 
              src={url} 
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
            {showDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 p-0"
                onClick={() => onDelete(url)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>
    )
  );

  // Compact Upload Zone Component
  const UploadZone = () => (
    <div 
      className={cn(
        "border-2 border-dashed border-border rounded p-2 text-center hover:border-primary/50 transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      )}
      onClick={() => !disabled && !isUploading && document.getElementById(`video-input-${productId}`)?.click()}
    >
      <input
        id={`video-input-${productId}`}
        type="file"
        accept={getVideoAcceptAttribute()}
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      {isUploading ? (
        <div className="flex items-center justify-center gap-2 py-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs text-muted-foreground">Загрузка...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-1">
          <Plus className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Добавить видео</span>
        </div>
      )}
    </div>
  );

  // Show only button mode
  if (showOnlyButton) {
    return (
      <div className={cn("space-y-2", className)}>
        <Button
          type="button"
          variant="outline"
          disabled={disabled || isUploading || videos.length >= maxVideos}
          size="sm"
          className="w-full h-8"
          onClick={() => document.getElementById(`video-input-button-${productId}`)?.click()}
        >
          {isUploading ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Plus className="mr-1 h-3 w-3" />
          )}
          {isUploading ? "Загрузка..." : buttonText}
          <input
            id={`video-input-button-${productId}`}
            type="file"
            accept={getVideoAcceptAttribute()}
            multiple
            onChange={handleFileChange}
            className="hidden"
            disabled={disabled || isUploading}
          />
        </Button>

        <UploadProgress />
      </div>
    );
  }

  // Show gallery only mode
  if (showGalleryOnly) {
    return (
      <div className={cn("space-y-2", className)}>
        <VideoGallery showDelete={!disabled} />
      </div>
    );
  }

  // Full component (default)
  return (
    <div className={cn("space-y-2", className)}>
      <UploadProgress />
      
      <VideoGallery />

      {videos.length < maxVideos && <UploadZone />}

      {videos.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          {videos.length}/{maxVideos}
        </div>
      )}
    </div>
  );
};