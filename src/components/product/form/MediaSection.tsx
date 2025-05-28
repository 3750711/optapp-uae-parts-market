
import React from 'react';
import { Label } from "@/components/ui/label";
import VideoUpload from "@/components/ui/video-upload";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";

interface MediaSectionProps {
  imageUrls: string[];
  videoUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
}

const MediaSection = React.memo<MediaSectionProps>(({ 
  imageUrls,
  videoUrls,
  handleMobileOptimizedImageUpload,
  setVideoUrls
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="images">Фотографии товара</Label>
        <MobileOptimizedImageUpload
          onUploadComplete={handleMobileOptimizedImageUpload}
          maxImages={30}
          storageBucket="Product Images"
          storagePath=""
          existingImages={imageUrls}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="videos">Видео товара (необязательно)</Label>
        <VideoUpload
          videos={videoUrls}
          onUpload={(urls) => setVideoUrls(prevUrls => [...prevUrls, ...urls])}
          onDelete={(urlToDelete) => setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete))}
          maxVideos={2}
          storageBucket="Product Images"
        />
      </div>
    </div>
  );
});

MediaSection.displayName = "MediaSection";

export default MediaSection;
