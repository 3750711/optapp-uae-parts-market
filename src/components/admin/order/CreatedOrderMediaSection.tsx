
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
    console.log('🔵 [DELETE START] Function called');
    console.log('🔵 [DELETE] URL to delete:', urlToDelete);
    console.log('🔵 [DELETE] Current images array:', images);
    console.log('🔵 [DELETE] Current images length:', images.length);
    console.log('🔵 [DELETE] Current videos array:', videos);
    
    const previousImages = images;
    const newImages = images.filter(url => url !== urlToDelete);
    
    console.log('🔵 [DELETE] Previous images count:', previousImages.length);
    console.log('🔵 [DELETE] New images count:', newImages.length);
    console.log('🔵 [DELETE] New images array:', newImages);
    console.log('🔵 [DELETE] Was URL found and removed?', previousImages.length !== newImages.length);
    
    // Обновляем локальное состояние
    console.log('🔵 [DELETE] Step 1: Updating UI with new images...');
    onImagesUpdate(newImages);
    console.log('🔵 [DELETE] Step 1: UI update called (state should change)');
    
    // Сохраняем в базу данных
    console.log('🔵 [DELETE] Step 2: Calling updateOrderMedia...');
    console.log('🔵 [DELETE] Passing to updateOrderMedia: images=', newImages, 'videos=', videos);
    
    const saved = await updateOrderMedia(newImages, videos);
    
    console.log('🔵 [DELETE] Step 3: updateOrderMedia returned:', saved);
    
    if (saved) {
      console.log('🟢 [DELETE SUCCESS] Photo deleted successfully');
      toast({
        title: "Photo Deleted",
        description: "Photo removed from order",
      });
    } else {
      console.log('🔴 [DELETE FAILED] Rolling back UI to previous state');
      console.log('🔴 [DELETE] Rolling back to:', previousImages);
      onImagesUpdate(previousImages);
      console.log('🔴 [DELETE] Rollback complete');
    }
    
    console.log('🔵 [DELETE END] Function completed');
  };

  const handleVideoDelete = async (urlToDelete: string) => {
    console.log('🔵 [VIDEO DELETE START] Function called');
    console.log('🔵 [VIDEO DELETE] URL to delete:', urlToDelete);
    console.log('🔵 [VIDEO DELETE] Current videos:', videos);
    
    const previousVideos = videos;
    const newVideos = videos.filter(url => url !== urlToDelete);
    
    console.log('🔵 [VIDEO DELETE] Previous videos count:', previousVideos.length);
    console.log('🔵 [VIDEO DELETE] New videos count:', newVideos.length);
    console.log('🔵 [VIDEO DELETE] New videos array:', newVideos);
    
    // Обновляем локальное состояние
    console.log('🔵 [VIDEO DELETE] Updating UI...');
    onVideosUpdate(newVideos);
    
    // Сохраняем в базу данных
    console.log('🔵 [VIDEO DELETE] Calling updateOrderMedia...');
    const saved = await updateOrderMedia(images, newVideos);
    
    console.log('🔵 [VIDEO DELETE] updateOrderMedia returned:', saved);
    
    if (saved) {
      console.log('🟢 [VIDEO DELETE SUCCESS] Video deleted');
      toast({
        title: "Video Deleted",
        description: "Video removed from order",
      });
    } else {
      console.log('🔴 [VIDEO DELETE FAILED] Rolling back');
      onVideosUpdate(previousVideos);
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
          <Button
            disabled={isProcessing}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-blue-50 relative`}
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
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
          </Button>
        </div>

        {/* Add Videos Button */}
        <div>
          <Button
            disabled={isProcessing}
            variant="outline"
            className={`w-full ${isMobile ? 'h-12' : 'h-10'} border-dashed border-2 hover:bg-green-50 relative`}
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
            <input
              type="file"
              multiple
              accept="video/mp4,video/mov,video/avi,video/webm"
              onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isProcessing}
            />
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
        <p>• Maximum 50 photos and 5 videos per order</p>
      </div>
    </div>
  );
};
