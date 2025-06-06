
import React from 'react';
import { Button } from "@/components/ui/button";
import { Cloud, Camera } from "lucide-react";

interface UploadControlsProps {
  isUploading: boolean;
  existingImagesCount: number;
  maxImages: number;
  isMobileDevice: boolean;
  onFileSelect: () => void;
  onCameraSelect: () => void;
}

export const UploadControls: React.FC<UploadControlsProps> = ({
  isUploading,
  existingImagesCount,
  maxImages,
  isMobileDevice,
  onFileSelect,
  onCameraSelect
}) => {
  const isDisabled = isUploading || existingImagesCount >= maxImages;

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={onFileSelect}
        disabled={isDisabled}
        className="flex-1"
      >
        <Cloud className="mr-2 h-4 w-4" />
        Загрузить в Cloudinary
      </Button>
      
      {isMobileDevice && (
        <Button
          type="button"
          variant="outline"
          onClick={onCameraSelect}
          disabled={isDisabled}
        >
          <Camera className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
