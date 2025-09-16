
import React from 'react';
import UnifiedImageUpload from './UnifiedImageUpload';

interface SimpleMediaSectionProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  disabled?: boolean;
  maxImages?: number;
}

const SimpleMediaSection: React.FC<SimpleMediaSectionProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  disabled = false,
  maxImages = 50
}) => {
  return (
    <UnifiedImageUpload
      images={images}
      onImagesUpload={onImagesUpload}
      onImageDelete={onImageDelete}
      disabled={disabled}
      maxImages={maxImages}
    />
  );
};

export default SimpleMediaSection;
