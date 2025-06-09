
import React from 'react';
import { Label } from '@/components/ui/label';
import TouchOptimizedInput from '@/components/ui/TouchOptimizedInput';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { UploadControls } from '@/components/ui/image-upload/UploadControls';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileOptimizedUpload } from '@/hooks/useMobileOptimizedUpload';
import { OrderFormData } from '@/hooks/useOrderForm';

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

      {/* Компактный блок загрузки изображений */}
      <div className="space-y-3">
        <Label className={isMobile ? "text-base font-medium" : ""}>
          Изображения
        </Label>
        
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isUploading}
            className="h-8"
          >
            {isUploading ? "Загрузка..." : "Добавить фото"}
          </Button>
          {images.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {images.length} файл(ов)
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

        {/* Простой предпросмотр изображений в одну строку */}
        {images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.map((url, index) => (
              <div key={index} className="relative flex-shrink-0">
                <img 
                  src={url} 
                  alt={`Изображение ${index + 1}`}
                  className="w-16 h-16 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => onImageDelete(url)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Прогресс загрузки */}
        {isUploading && uploadProgress.length > 0 && (
          <div className="bg-muted/50 rounded p-2 space-y-1">
            <div className="text-xs text-muted-foreground">
              Загрузка {uploadProgress.filter(p => p.status === 'success').length}/{uploadProgress.length}
            </div>
            {uploadProgress.map((progress, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="truncate max-w-[120px]">{progress.fileName}</span>
                  <span>{Math.round(progress.progress)}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
