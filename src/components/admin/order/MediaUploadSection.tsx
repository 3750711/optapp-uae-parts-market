
import React from "react";
import { Label } from "@/components/ui/label";
import { RealtimeImageUpload } from "@/components/ui/real-time-image-upload";
import { VideoUpload } from "@/components/ui/video-upload";

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
  return (
    <>
      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        <RealtimeImageUpload
          onUploadComplete={onImagesUpload}
          maxImages={25}
          storageBucket="order-images"
          storagePath=""
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
    </>
  );
};
