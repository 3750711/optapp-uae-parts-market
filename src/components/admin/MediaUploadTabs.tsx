
import React from "react";
import { Upload, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";

interface MediaUploadTabsProps {
  confirmImages: string[];
  confirmVideos: string[];
  onImagesUpload: (urls: string[]) => void;
  onVideosUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  onVideoDelete: (url: string) => void;
  orderId: string;
  disabled: boolean;
}

export const MediaUploadTabs: React.FC<MediaUploadTabsProps> = ({
  confirmImages,
  confirmVideos,
  onImagesUpload,
  onVideosUpload,
  onImageDelete,
  onVideoDelete,
  orderId,
  disabled
}) => {
  return (
    <Tabs defaultValue="images" className="w-full">
      <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
        <TabsTrigger value="images" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
          Фото ({confirmImages.length})
        </TabsTrigger>
        <TabsTrigger value="videos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
          <Video className="h-3 w-3 sm:h-4 sm:w-4" />
          Видео ({confirmVideos.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="images" className="space-y-3 mt-3">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6">
          <MobileOptimizedImageUpload
            onUploadComplete={onImagesUpload}
            maxImages={10}
            existingImages={confirmImages}
            onImageDelete={onImageDelete}
            disabled={disabled}
          />
        </div>
      </TabsContent>

      <TabsContent value="videos" className="space-y-3 mt-3">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 sm:p-6">
          <CloudinaryVideoUpload
            videos={confirmVideos}
            onUpload={onVideosUpload}
            onDelete={onVideoDelete}
            maxVideos={5}
            productId={orderId}
            buttonText="Загрузить видео подтверждения"
            disabled={disabled}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
};
