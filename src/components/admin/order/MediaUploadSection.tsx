
import React from "react";
import { Label } from "@/components/ui/label";
import { RealtimeImageUpload } from "@/components/ui/real-time-image-upload";
import { VideoUpload } from "@/components/ui/video-upload";
import { ImageUpload } from "@/components/ui/image-upload";

interface MediaUploadSectionProps {
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  videos,
  onImagesUpload,
  onVideoUpload,
  onVideoDelete,
}) => {
  
  const handleImageDelete = async (url: string) => {
    // This will be handled by the parent component through database operations
    // For now, we'll just show a notification that the image will be removed
    console.log("Image delete requested:", url);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        <ImageUpload
          images={images}
          onUpload={onImagesUpload}
          onDelete={handleImageDelete}
          maxImages={25}
          storageBucket="order-images"
        />
      </div>

      <div className="space-y-2">
        <Label>Видео заказа</Label>
        <VideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          maxVideos={2}
          storageBucket="order-videos"
          storagePrefix=""
        />
      </div>
    </div>
  );
};
