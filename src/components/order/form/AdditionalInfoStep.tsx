
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ImageIcon, VideoIcon, X } from 'lucide-react';
import { OrderFormData } from '@/hooks/useOrderForm';

interface AdditionalInfoStepProps {
  formData: OrderFormData;
  images: string[];
  videos: string[];
  onInputChange: (field: string, value: string) => void;
  onImageUpload: (urls: string[]) => void;
  onImageDelete: (url: string) => void;
  onVideoUpload: (urls: string[]) => void;
  onVideoDelete: (url: string) => void;
}

const AdditionalInfoStep: React.FC<AdditionalInfoStepProps> = ({
  formData,
  images,
  videos,
  onInputChange,
  onImageUpload,
  onImageDelete,
  onVideoUpload,
  onVideoDelete
}) => {
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Здесь должна быть логика загрузки изображений
      // Пока просто создаем фиктивные URL для демонстрации
      const urls = Array.from(files).map((file, index) => 
        URL.createObjectURL(file) + `?${Date.now()}-${index}`
      );
      onImageUpload(urls);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Здесь должна быть логика загрузки видео
      // Пока просто создаем фиктивные URL для демонстрации
      const urls = Array.from(files).map((file, index) => 
        URL.createObjectURL(file) + `?${Date.now()}-${index}`
      );
      onVideoUpload(urls);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Дополнительная информация</h3>

      {/* Описание */}
      <div className="space-y-2">
        <Label htmlFor="description">Описание заказа</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Добавьте дополнительную информацию о заказе"
          rows={4}
        />
      </div>

      {/* Загрузка изображений */}
      <div className="space-y-4">
        <Label>Изображения товара</Label>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex items-center gap-2 relative"
            >
              <ImageIcon className="h-4 w-4" />
              Загрузить изображения
              <input
                type="file"
                accept="image/*,image/heic,image/heif"
                multiple
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
            <span className="text-sm text-gray-500">
              {images.length}/10 изображений
            </span>
          </div>

          {/* Превью изображений */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative">
                  <img
                    src={url}
                    alt={`Изображение ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => onImageDelete(url)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Загрузка видео */}
      <div className="space-y-4">
        <Label>Видео товара</Label>
        
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              multiple
              onChange={handleVideoChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('video-upload')?.click()}
              className="flex items-center gap-2"
            >
              <VideoIcon className="h-4 w-4" />
              Загрузить видео
            </Button>
            <span className="text-sm text-gray-500">
              {videos.length}/3 видео
            </span>
          </div>

          {/* Превью видео */}
          {videos.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {videos.map((url, index) => (
                <div key={index} className="relative">
                  <video
                    src={url}
                    className="w-full h-32 object-cover rounded border"
                    controls
                  />
                  <button
                    type="button"
                    onClick={() => onVideoDelete(url)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Информация о покупателе */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="buyerName">Имя покупателя</Label>
          <input
            id="buyerName"
            type="text"
            value={formData.buyerName}
            onChange={(e) => onInputChange('buyerName', e.target.value)}
            placeholder="Введите имя покупателя"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="buyerPhone">Телефон покупателя</Label>
          <input
            id="buyerPhone"
            type="tel"
            value={formData.buyerPhone}
            onChange={(e) => onInputChange('buyerPhone', e.target.value)}
            placeholder="Введите телефон покупателя"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
