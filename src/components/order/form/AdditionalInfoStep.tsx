
import React from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizedUpload } from '@/hooks/useMobileOptimizedUpload';
import { CloudinaryVideoUpload } from '@/components/ui/cloudinary-video-upload';
import { OrderFormData } from '@/hooks/useOrderForm';
import { ImageIcon, VideoIcon, Plus, X } from 'lucide-react';

interface AdditionalInfoStepProps {
  formData: OrderFormData;
  images: string[];
  videos: string[];
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  setVideos: (videos: string[]) => void;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  formData,
  images,
  videos,
  onInputChange,
  onImageUpload,
  onImageDelete,
  setVideos
}) => {
  const isMobile = useIsMobile();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { 
    isUploading, 
    uploadProgress, 
    uploadFilesBatch,
    clearProgress
  } = useMobileOptimizedUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      try {
        const uploadedUrls = await uploadFilesBatch(fileArray, {
          productId: 'order-' + Date.now(),
          batchSize: 2,
          batchDelay: 1000
        });
        
        if (uploadedUrls.length > 0) {
          onImageUpload(uploadedUrls);
        }
      } catch (error) {
        console.error('Upload error:', error);
      }
      
      e.target.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoUpload = (urls: string[]) => {
    setVideos([...videos, ...urls]);
  };

  const handleVideoDelete = (url: string) => {
    setVideos(videos.filter(v => v !== url));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Дополнительная информация</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="place_number" className={isMobile ? "text-base font-medium" : ""}>
            Номер места
          </Label>
          <TouchOptimizedInput 
            id="place_number"
            value={formData.place_number}
            onChange={(e) => onInputChange('place_number', e.target.value)}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryMethod" className={isMobile ? "text-base font-medium" : ""}>
            Способ доставки
          </Label>
          <Select
            value={formData.deliveryMethod}
            onValueChange={(value) => onInputChange('deliveryMethod', value)}
          >
            <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
              <SelectValue placeholder="Выберите способ доставки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self_pickup">Самовывоз</SelectItem>
              <SelectItem value="courier">Курьер</SelectItem>
              <SelectItem value="post">Почта</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text_order" className={isMobile ? "text-base font-medium" : ""}>
          Описание заказа
        </Label>
        <Textarea 
          id="text_order"
          value={formData.text_order}
          onChange={(e) => onInputChange('text_order', e.target.value)}
          placeholder="Дополнительные детали заказа..."
          className={isMobile ? "min-h-[120px] text-base" : "min-h-[100px]"}
        />
      </div>

      {/* Компактный блок загрузки медиа */}
      <div className="space-y-3">
        <Label className={isMobile ? "text-base font-medium" : ""}>
          Медиафайлы
        </Label>
        
        {/* Кнопки загрузки */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <ImageIcon className="h-4 w-4" />
            {isUploading ? "Загрузка..." : "Фото"}
          </Button>
          
          <CloudinaryVideoUpload
            videos={videos}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            maxVideos={3}
            showOnlyButton={true}
            buttonText="Видео"
            buttonIcon={<VideoIcon className="h-4 w-4" />}
            disabled={isUploading}
          />
          
          {(images.length > 0 || videos.length > 0) && (
            <span className="text-sm text-muted-foreground self-center">
              {images.length + videos.length} файл(ов)
            </span>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        {/* Компактная галерея медиафайлов */}
        {(images.length > 0 || videos.length > 0) && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {/* Фотографии */}
            {images.map((url, index) => (
              <div key={`img-${index}`} className="relative aspect-square">
                <img 
                  src={url} 
                  alt={`Фото ${index + 1}`}
                  className="w-full h-full object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => onImageDelete(url)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 text-white text-xs">
                  <ImageIcon className="h-3 w-3" />
                </div>
              </div>
            ))}
            
            {/* Видео */}
            {videos.map((url, index) => (
              <div key={`vid-${index}`} className="relative aspect-square">
                <video 
                  src={url} 
                  className="w-full h-full object-cover rounded border"
                  muted
                />
                <button
                  type="button"
                  onClick={() => handleVideoDelete(url)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black/50 rounded px-1 text-white text-xs">
                  <VideoIcon className="h-3 w-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Прогресс загрузки */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="bg-muted/50 rounded p-3">
            <div className="text-sm font-medium mb-2">
              Загрузка {uploadProgress.filter(p => p.status === 'success').length}/{uploadProgress.length}
            </div>
            <div className="space-y-2">
              {uploadProgress.map((progress, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate">{progress.fileName}</span>
                      <span>{Math.round(progress.progress)}%</span>
                    </div>
                    <div className="w-full bg-background rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
