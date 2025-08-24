
import React, { useState } from 'react';
import { Camera, Video, Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptimizedImageUpload } from '@/hooks/useOptimizedImageUpload';
import { useCloudinaryVideoUpload } from '@/hooks/useCloudinaryVideoUpload';
import { useOrderUpdate } from '@/hooks/useOrderUpdate';
import { CompactMediaGrid } from '@/components/media/CompactMediaGrid';

interface CreatedOrderMediaSectionProps {
  orderId: string;
  images: string[];
  videos: string[];
  onImagesUpdate: (newImages: string[]) => void;
  onVideosUpdate: (newVideos: string[]) => void;
}

export const CreatedOrderMediaSection: React.FC<CreatedOrderMediaSectionProps> = ({
  orderId,
  images,
  videos,
  onImagesUpdate,
  onVideosUpdate
}) => {
  const isMobile = useIsMobile();
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isVideoUploading, setIsVideoUploading] = useState(false);

  const { uploadFiles } = useOptimizedImageUpload();
  const { uploadMultipleVideos } = useCloudinaryVideoUpload();
  const { updateOrderMedia, isUpdating } = useOrderUpdate({ 
    orderId,
    onSuccess: () => {
      console.log('✅ Order media saved to database successfully');
    }
  });

  const handleImageUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsImageUploading(true);
    try {
      const fileArray = Array.from(files);
      console.log('📸 Uploading images for order:', orderId, fileArray.length, 'files');

      const uploadedUrls = await uploadFiles(fileArray);

      if (uploadedUrls.length > 0) {
        const newImages = [...images, ...uploadedUrls];
        
        // Обновляем локальное состояние
        onImagesUpdate(newImages);
        
        // Сохраняем в базу данных
        const saved = await updateOrderMedia(newImages, videos);
        
        if (saved) {
          toast({
            title: "Photos Added",
            description: `Added ${uploadedUrls.length} photos to order`,
          });
        } else {
          // Откатываем локальное состояние при ошибке сохранения
          onImagesUpdate(images);
        }
      }
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload photos",
        variant: "destructive",
      });
    } finally {
      setIsImageUploading(false);
    }
  };

  const handleVideoUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsVideoUploading(true);
    try {
      const fileArray = Array.from(files);
      console.log('🎥 Uploading videos for order:', orderId, fileArray.length, 'files');

      const results = await uploadMultipleVideos(fileArray);
      const uploadedUrls = results.filter(Boolean);
      
      if (uploadedUrls.length > 0) {
        const newVideos = [...videos, ...uploadedUrls];
        
        // Обновляем локальное состояние
        onVideosUpdate(newVideos);
        
        // Сохраняем в базу данных
        const saved = await updateOrderMedia(images, newVideos);
        
        if (saved) {
          toast({
            title: "Videos Added",
            description: `Added ${uploadedUrls.length} videos to order`,
          });
        } else {
          // Откатываем локальное состояние при ошибке сохранения
          onVideosUpdate(videos);
        }
      }
    } catch (error) {
      console.error('❌ Error uploading videos:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload videos",
        variant: "destructive",
      });
    } finally {
      setIsVideoUploading(false);
    }
  };

  const handleImageDelete = async (urlToDelete: string) => {
    const newImages = images.filter(url => url !== urlToDelete);
    
    // Обновляем локальное состояние
    onImagesUpdate(newImages);
    
    // Сохраняем в базу данных
    const saved = await updateOrderMedia(newImages, videos);
    
    if (saved) {
      toast({
        title: "Photo Deleted",
        description: "Photo removed from order",
      });
    } else {
      // Откатываем локальное состояние при ошибке
      onImagesUpdate(images);
    }
  };

  const handleVideoDelete = async (urlToDelete: string) => {
    const newVideos = videos.filter(url => url !== urlToDelete);
    
    // Обновляем локальное состояние
    onVideosUpdate(newVideos);
    
    // Сохраняем в базу данных
    const saved = await updateOrderMedia(images, newVideos);
    
    if (saved) {
      toast({
        title: "Video Deleted",
        description: "Video removed from order",
      });
    } else {
      // Откатываем локальное состояние при ошибке
      onVideosUpdate(videos);
    }
  };

  const totalMediaCount = images.length + videos.length;
  const isProcessing = isImageUploading || isVideoUploading || isUpdating;

  return (
    <div className="space-y-4">
      {/* Header with media count */}
      <div className="flex items-center justify-between">
        <h3 className={`font-medium ${isMobile ? 'text-base' : 'text-lg'}`}>
          Order Media Files ({totalMediaCount})
        </h3>
        {totalMediaCount > 0 && (
          <div className="text-sm text-gray-500">
            📸 {images.length} • 🎥 {videos.length}
          </div>
        )}
      </div>

      {/* Upload buttons */}
      <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {/* Add Photos Button */}
        <div>
          <input
            type="file"
            id={`order-images-${orderId}`}
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById(`order-images-${orderId}`)?.click()}
            disabled={isProcessing}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-blue-50`}
          >
            {isImageUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading photos...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Add Photos to Order
              </>
            )}
          </Button>
        </div>

        {/* Add Videos Button */}
        <div>
          <input
            type="file"
            id={`order-videos-${orderId}`}
            multiple
            accept="video/*"
            onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
            className="hidden"
          />
          <Button
            onClick={() => document.getElementById(`order-videos-${orderId}`)?.click()}
            disabled={isProcessing}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-green-50`}
          >
            {isVideoUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Uploading videos...
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Add Videos to Order
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Loading indicator for database updates */}
      {isUpdating && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Upload className="h-4 w-4 animate-spin" />
            Saving to database...
          </div>
        </div>
      )}

      {/* Compact Media Grid - shows all media at once */}
      {totalMediaCount > 0 && (
        <Card>
          <CardContent className="p-4">
            <CompactMediaGrid
              images={images}
              videos={videos}
              maxPreviewItems={50}
              onImageDelete={handleImageDelete}
              onVideoDelete={handleVideoDelete}
            />
          </CardContent>
        </Card>
      )}

      {/* Upload instructions */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Photos are automatically compressed to 400KB and converted to WebP</p>
        <p>• Supports JPG, PNG, GIF for photos • MP4, MOV, AVI for videos</p>
        <p>• Maximum 25 photos and 5 videos per order</p>
      </div>
    </div>
  );
};
