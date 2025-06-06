
import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Video } from "lucide-react";
import VideoUpload from "@/components/ui/video-upload";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";

interface MediaSectionProps {
  imageUrls: string[];
  videoUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
}

const MediaSection = React.memo<MediaSectionProps>(({ 
  imageUrls,
  videoUrls,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId
}) => {
  return (
    <div className="space-y-6">
      {/* Кнопки загрузки */}
      <div className="flex gap-3">
        <div className="flex-1">
          <MobileOptimizedImageUpload
            onUploadComplete={handleMobileOptimizedImageUpload}
            maxImages={30}
            existingImages={imageUrls}
            onImageDelete={onImageDelete}
            onSetPrimaryImage={onSetPrimaryImage}
            primaryImage={primaryImage}
            productId={productId}
            showOnlyButton={true}
            buttonText="Загрузить фото"
            buttonIcon={<Upload className="h-4 w-4" />}
          />
        </div>
        
        <div className="flex-1">
          <VideoUpload
            videos={videoUrls}
            onUpload={(urls) => setVideoUrls(prevUrls => [...prevUrls, ...urls])}
            onDelete={(urlToDelete) => setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete))}
            maxVideos={2}
            storageBucket="Product Images"
            showOnlyButton={true}
            buttonText="Загрузить видео"
            buttonIcon={<Video className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Счетчики загруженных файлов */}
      {(imageUrls.length > 0 || videoUrls.length > 0) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            {imageUrls.length > 0 && (
              <span className="text-green-800">
                📸 Фото: {imageUrls.length}/30
              </span>
            )}
            {videoUrls.length > 0 && (
              <span className="text-green-800">
                🎥 Видео: {videoUrls.length}/2
              </span>
            )}
          </div>
        </div>
      )}

      {/* Галерея загруженных фото */}
      {imageUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные фотографии</Label>
          <MobileOptimizedImageUpload
            onUploadComplete={handleMobileOptimizedImageUpload}
            maxImages={30}
            existingImages={imageUrls}
            onImageDelete={onImageDelete}
            onSetPrimaryImage={onSetPrimaryImage}
            primaryImage={primaryImage}
            productId={productId}
            showGalleryOnly={true}
          />
        </div>
      )}

      {/* Галерея загруженных видео */}
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные видео</Label>
          <VideoUpload
            videos={videoUrls}
            onUpload={(urls) => setVideoUrls(prevUrls => [...prevUrls, ...urls])}
            onDelete={(urlToDelete) => setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete))}
            maxVideos={2}
            storageBucket="Product Images"
            showGalleryOnly={true}
          />
        </div>
      )}
    </div>
  );
});

MediaSection.displayName = "MediaSection";

export default MediaSection;
