import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Video } from "lucide-react";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
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
  const totalMediaCount = imageUrls.length + videoUrls.length;

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
          <MobileOptimizedImageUpload
            onUploadComplete={handleMobileOptimizedImageUpload}
            maxImages={50}
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

      {/* Счетчик загруженных файлов */}
      {totalMediaCount > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              📁 Медиафайлов: {totalMediaCount} (📸 Фото: {imageUrls.length}/50, 🎥 Видео: {videoUrls.length}/2)
            </span>
          </div>
        </div>
      )}

      {/* Объединенная галерея фото и видео */}
      {totalMediaCount > 0 && (
        <div className="space-y-2">
          <Label>Загруженные медиафайлы</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Фотографии */}
            {imageUrls.map((url, index) => (
              <div key={`image-${index}`} className="relative aspect-square rounded-lg overflow-hidden border">
                <img 
                  src={url} 
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {primaryImage === url && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    Главное
                  </div>
                )}
                {onImageDelete && (
                  <button
                    type="button"
                    onClick={() => onImageDelete(url)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* Видео */}
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
});

MediaSection.displayName = "MediaSection";

export default MediaSection;
