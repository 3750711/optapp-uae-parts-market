
import React, { useCallback, useState } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Video } from "lucide-react";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { useOptimizedImageUpload } from "@/hooks/useOptimizedImageUpload";
import UploadProgressIndicator from "@/components/ui/optimized-image-upload/UploadProgressIndicator";
import OptimizedImageGallery from "@/components/ui/optimized-image-upload/OptimizedImageGallery";

interface OptimizedMediaSectionProps {
  imageUrls: string[];
  videoUrls: string[];
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  onImageDelete?: (url: string) => void;
  onSetPrimaryImage?: (url: string) => void;
  primaryImage?: string;
  productId?: string;
  disabled?: boolean;
}

const OptimizedMediaSection: React.FC<OptimizedMediaSectionProps> = ({
  imageUrls,
  videoUrls,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  onImageDelete,
  onSetPrimaryImage,
  primaryImage,
  productId,
  disabled = false
}) => {
  const { uploadFiles, uploadQueue, isUploading, getPreviewUrls, clearQueue } = useOptimizedImageUpload();
  const [fileInputKey, setFileInputKey] = useState(0);

  const totalMediaCount = imageUrls.length + videoUrls.length;
  const allImageUrls = [...imageUrls, ...getPreviewUrls()];

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    try {
      const uploadedUrls = await uploadFiles(fileArray, {
        productId,
        maxConcurrent: 3,
        disableToast: false
      });
      
      if (uploadedUrls.length > 0) {
        handleMobileOptimizedImageUpload(uploadedUrls);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    }
    
    // Reset file input
    setFileInputKey(prev => prev + 1);
  }, [uploadFiles, productId, handleMobileOptimizedImageUpload]);

  const handleVideoUpload = (urls: string[]) => {
    setVideoUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete));
  };

  return (
    <div className="space-y-6">
      {/* Upload buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Button
            type="button"
            variant="outline"
            className="w-full h-12"
            disabled={disabled || isUploading || imageUrls.length >= 30}
            onClick={() => document.getElementById('optimized-image-input')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Загрузка...' : 'Загрузить фото'}
          </Button>
          <input
            key={fileInputKey}
            id="optimized-image-input"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || isUploading}
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

      {/* Upload progress */}
      {uploadQueue.length > 0 && (
        <UploadProgressIndicator
          uploads={uploadQueue}
          onClear={clearQueue}
        />
      )}

      {/* Media counter */}
      {totalMediaCount > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-800">
              📁 Медиафайлов: {totalMediaCount} (📸 Фото: {imageUrls.length}/30, 🎥 Видео: {videoUrls.length}/2)
            </span>
          </div>
        </div>
      )}

      {/* Image gallery */}
      {allImageUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные фотографии</Label>
          <OptimizedImageGallery
            images={allImageUrls}
            primaryImage={primaryImage}
            onSetPrimary={onSetPrimaryImage}
            onDelete={onImageDelete}
            disabled={disabled}
          />
        </div>
      )}

      {/* Video gallery */}
      {videoUrls.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные видео</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  disabled={disabled}
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
};

export default OptimizedMediaSection;
