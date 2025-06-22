
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, X, Image, Video } from 'lucide-react';

interface MediaUploadTabsProps {
  confirmImages: string[];
  confirmVideos: string[];
  onImagesUpload: (files: File[]) => Promise<void>;
  onVideosUpload: (files: File[]) => Promise<void>;
  onImageDelete: (url: string) => Promise<void>;
  onVideoDelete: (url: string) => Promise<void>;
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
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onImagesUpload(Array.from(files));
    }
    event.target.value = '';
  };

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      await onVideosUpload(Array.from(files));
    }
    event.target.value = '';
  };

  return (
    <Tabs defaultValue="images" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="images" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Фото ({confirmImages.length})
        </TabsTrigger>
        <TabsTrigger value="videos" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          Видео ({confirmVideos.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="images" className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Подтверждающие фотографии</h4>
          <Badge variant="outline">{confirmImages.length}/10</Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`image-upload-${orderId}`)?.click()}
          disabled={disabled || confirmImages.length >= 10}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Загрузить фото
        </Button>

        <input
          id={`image-upload-${orderId}`}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          disabled={disabled}
        />

        {confirmImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {confirmImages.map((url, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Confirmation ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onImageDelete(url)}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="videos" className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Подтверждающие видео</h4>
          <Badge variant="outline">{confirmVideos.length}/3</Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById(`video-upload-${orderId}`)?.click()}
          disabled={disabled || confirmVideos.length >= 3}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          Загрузить видео
        </Button>

        <input
          id={`video-upload-${orderId}`}
          type="file"
          multiple
          accept="video/*"
          onChange={handleVideoUpload}
          className="hidden"
          disabled={disabled}
        />

        {confirmVideos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {confirmVideos.map((url, index) => (
              <div key={index} className="relative aspect-video">
                <video
                  src={url}
                  controls
                  className="w-full h-full object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onVideoDelete(url)}
                  className="absolute top-2 right-2 h-6 w-6 p-0"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
