
import React from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';

interface MediaUploadSectionProps {
  images: string[];
  videos: string[];
  onImageUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  disabled?: boolean;
  isMobile?: boolean;
}

const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  images,
  videos,
  onImageUpload,
  onImageDelete,
  onVideoUpload,
  onVideoDelete,
  disabled = false,
  isMobile = false
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className={`font-medium mb-3 ${isMobile ? "text-base" : ""}`}>
          Фотографии товара
        </h3>
        <ImageUpload
          images={images}
          onUpload={onImageUpload}
          onDelete={onImageDelete}
          disabled={disabled}
          maxImages={10}
        />
      </div>

      <div>
        <h3 className={`font-medium mb-3 ${isMobile ? "text-base" : ""}`}>
          Видео товара (необязательно)
        </h3>
        <CloudinaryVideoUpload
          videos={videos}
          onUpload={onVideoUpload}
          onDelete={onVideoDelete}
          disabled={disabled}
          maxVideos={3}
        />
      </div>
    </div>
  );
};

export default MediaUploadSection;
