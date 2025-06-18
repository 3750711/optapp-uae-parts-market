
import React from 'react';
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import OptimizedSellerOrderFormFields from './OptimizedSellerOrderFormFields';
import AdvancedImageUpload from './AdvancedImageUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { MobileFormSection } from './MobileFormSection';

interface AdminFreeOrderFormContentProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  images: string[];
  videos: string[];
  onImagesUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
  disabled: boolean;
}

export const AdminFreeOrderFormContent: React.FC<AdminFreeOrderFormContentProps> = ({
  formData,
  handleInputChange,
  images,
  videos,
  onImagesUpload,
  onImageDelete,
  onVideoUpload,
  onVideoDelete,
  disabled
}) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      <OptimizedSellerOrderFormFields
        formData={formData}
        handleInputChange={handleInputChange}
        disabled={disabled}
      />
      
      <MobileFormSection 
        title="Медиафайлы заказа" 
        icon={<Camera className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-6">
          <div>
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Изображения</h3>
            <AdvancedImageUpload
              images={images}
              onImagesUpload={onImagesUpload}
              onImageDelete={onImageDelete}
              onSetPrimaryImage={() => {}}
              disabled={disabled}
              maxImages={25}
            />
          </div>

          <div>
            <h3 className={`font-medium mb-4 ${isMobile ? 'text-base' : 'text-lg'}`}>Видео</h3>
            <CloudinaryVideoUpload
              videos={videos}
              onUpload={onVideoUpload}
              onDelete={onVideoDelete}
              maxVideos={5}
              disabled={disabled}
            />
          </div>
        </div>
      </MobileFormSection>
    </div>
  );
};
