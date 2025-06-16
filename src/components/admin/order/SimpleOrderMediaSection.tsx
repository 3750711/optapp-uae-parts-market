
import React, { useCallback, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useSimpleOrderMediaUpload } from "@/hooks/useSimpleOrderMediaUpload";
import SimpleImageGallery from "@/components/ui/simple-image-gallery/SimpleImageGallery";

interface SimpleOrderMediaSectionProps {
  images: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete?: (url: string) => void;
  orderId?: string;
  disabled?: boolean;
}

const SimpleOrderMediaSection: React.FC<SimpleOrderMediaSectionProps> = ({
  images,
  onImagesUpload,
  onImageDelete,
  orderId,
  disabled = false
}) => {
  const { uploadFiles, isUploading } = useSimpleOrderMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (fileArray.length === 0) return;

    try {
      const uploadedUrls = await uploadFiles(fileArray, orderId);
      if (uploadedUrls.length > 0) {
        onImagesUpload(uploadedUrls);
      }
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
    }
    
    // Сброс input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [uploadFiles, orderId, onImagesUpload]);

  const handleImageDelete = useCallback((url: string) => {
    const newImages = images.filter(img => img !== url);
    onImagesUpload(newImages);
    
    if (onImageDelete) {
      onImageDelete(url);
    }
  }, [images, onImagesUpload, onImageDelete]);

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Фотографии заказа</Label>
      
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className="w-full max-w-xs"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Загрузка...' : 'Загрузить фото'}
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <SimpleImageGallery
        images={images}
        onDelete={handleImageDelete}
        disabled={disabled}
        isUploading={isUploading}
      />
    </div>
  );
};

export default SimpleOrderMediaSection;
