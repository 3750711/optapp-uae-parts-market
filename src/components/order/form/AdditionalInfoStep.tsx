
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="description">Дополнительная информация</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Добавьте дополнительную информацию о заказе"
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="buyerName">Имя покупателя *</Label>
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
        <Label htmlFor="buyerPhone">Телефон покупателя *</Label>
        <input
          id="buyerPhone"
          type="tel"
          value={formData.buyerPhone}
          onChange={(e) => onInputChange('buyerPhone', e.target.value)}
          placeholder="Введите телефон покупателя"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {images.length > 0 && (
        <div className="space-y-2">
          <Label>Загруженные изображения ({images.length})</Label>
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
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
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

export default AdditionalInfoStep;
