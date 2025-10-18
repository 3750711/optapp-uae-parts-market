import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Camera } from 'lucide-react';
import { useNewCloudinaryUpload } from '@/hooks/useCloudinaryUpload';
import { cn } from '@/lib/utils';
import { CloudinaryNormalized } from '@/types/cloudinary';
import { useLanguage } from '@/hooks/useLanguage';
import { getFormTranslations } from '@/utils/translations/forms';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface CloudinaryPhotoUploaderProps {
  images: string[];
  onImageUpload: (newUrls: string[]) => void;
  onImageDelete?: (urlToDelete: string) => void;
  maxImages?: number;
  className?: string;
  disabled?: boolean;
  onWidgetStateChange?: (isOpen: boolean) => void;
  category?: 'chat_screenshot' | 'signed_product';
  onImageUploadWithCategory?: (newUrls: string[], category: string) => Promise<void>;
}

export const CloudinaryPhotoUploader: React.FC<CloudinaryPhotoUploaderProps> = ({
  images = [],
  onImageUpload,
  onImageDelete,
  maxImages = 10,
  className,
  disabled = false,
  onWidgetStateChange,
  category,
  onImageUploadWithCategory
}) => {
  const { isUploading, uploadProgress, openUploadWidget } = useNewCloudinaryUpload();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const isOpeningRef = useRef(false); // ✅ FIX: Синхронная защита от двойного клика на Android
  const { language } = useLanguage();
  const t = getFormTranslations(language);

  // Notify parent component about widget state changes
  useEffect(() => {
    onWidgetStateChange?.(isWidgetOpen);
  }, [isWidgetOpen, onWidgetStateChange]);

  // ✅ FIX: Cleanup ref при unmount компонента
  useEffect(() => {
    return () => {
      isOpeningRef.current = false;
    };
  }, []);

  // ✅ FIX: Event listener cleanup с синхронным сбросом ref
  useEffect(() => {
    const handleWidgetClose = () => {
      console.log('🎬 Widget close event detected');
      isOpeningRef.current = false; // ✅ Сбрасываем ref синхронно
      setIsWidgetOpen(false);
    };
    
    document.addEventListener('cloudinary-widget-close', handleWidgetClose);
    
    return () => {
      document.removeEventListener('cloudinary-widget-close', handleWidgetClose);
    };
  }, []);

  const canUploadMore = images.length < maxImages;
  const remainingSlots = maxImages - images.length;

  const handleUpload = () => {
    // ✅ FIX: Синхронная проверка через ref для защиты от touch/click race на Android
    if (!canUploadMore || disabled || isWidgetOpen || isOpeningRef.current) {
      console.log('🚫 Upload blocked:', {
        canUploadMore,
        disabled,
        isWidgetOpen,
        isOpening: isOpeningRef.current
      });
      return;
    }

    // ✅ FIX: Немедленная синхронная блокировка через ref
    isOpeningRef.current = true;
    setIsWidgetOpen(true);
    
    console.log('🎬 Opening Cloudinary widget...');
    
    openUploadWidget(
      async (results: CloudinaryNormalized[]) => {
        console.log('🎯 CloudinaryPhotoUploader received normalized results:', results);
        
        if (process.env.NODE_ENV !== "production") {
          console.debug("[CloudinaryPhotoUploader] raw results:", results);
          console.debug("[CloudinaryPhotoUploader] normalized:", results);
        }
        
        const newUrls = results.map(result => result.url).filter(Boolean);
        
        console.log('📸 Final URLs to upload:', newUrls);
        
        // If category is provided, save to DB first
        if (category && onImageUploadWithCategory) {
          try {
            console.log('💾 Saving to database...');
            await onImageUploadWithCategory(newUrls, category);
            console.log('✅ Database save complete');
          } catch (error) {
            console.error('❌ Failed to save to database:', error);
            // ✅ FIX: Сброс блокировки при ошибке
            isOpeningRef.current = false;
            setIsWidgetOpen(false);
            return; // Don't update UI if save failed
          }
        }
        
        // Only update UI after successful DB save
        onImageUpload(newUrls);
        
        // ✅ FIX: Сброс блокировки после успешной загрузки
        isOpeningRef.current = false;
        setIsWidgetOpen(false);
      },
      {
        multiple: true,
        maxFiles: remainingSlots,
        folder: 'product-images'
      }
    );
  };

  const handleDelete = (imageUrl: string) => {
    if (onImageDelete) {
      onImageDelete(imageUrl);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Button - Mobile Optimized */}
      <Button
        type="button"
        onClick={handleUpload}
        disabled={!canUploadMore || disabled || isUploading || isWidgetOpen || isOpeningRef.current}
        variant="outline"
        size="lg"
        className="flex items-center gap-2 w-full min-h-[48px] text-base touch-manipulation sm:w-auto sm:min-h-[40px] sm:text-sm"
      >
        <Camera className="w-5 h-5 sm:w-4 sm:h-4" />
        {isUploading ? t.buttons.uploading : 
         isWidgetOpen ? t.buttons.widgetOpen :
         t.buttons.addPhoto}
      </Button>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-3">Прогресс загрузки</h4>
            <div className="space-y-2">
              {uploadProgress.map((item) => (
                <div key={item.fileId} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate">{item.fileName}</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-3 sm:h-2" />
                  {item.error && (
                    <p className="text-xs text-destructive">{item.error}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {images.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group">
              <div className="aspect-[4/3] rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <OptimizedImage
                  src={imageUrl}
                  alt={`Фото товара ${index + 1}`}
                  className="w-full h-full object-contain"
                  size="preview"
                  priority={index === 0}
                />
              </div>
              
              {/* Delete Button - Mobile Optimized */}
              {onImageDelete && (
                <button
                  onClick={() => handleDelete(imageUrl)}
                  className="absolute -top-2 -right-2 w-8 h-8 sm:w-6 sm:h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 sm:opacity-0 touch-manipulation transition-opacity shadow-lg hover:bg-destructive/90 active:scale-95"
                  aria-label="Удалить фото"
                >
                  <X className="w-4 h-4 sm:w-3 sm:h-3" />
                </button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};