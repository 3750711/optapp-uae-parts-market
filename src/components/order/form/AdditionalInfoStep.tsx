
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { VideoUpload } from '@/components/ui/video-upload';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';
import { useAuth } from '@/contexts/AuthContext';
import { OrderFormData } from '@/hooks/useOrderForm';
import { Database } from '@/integrations/supabase/types';

type DeliveryMethod = Database["public"]["Enums"]["delivery_method"];

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
  const { profile } = useAuth();

  const handleVideoUpload = (urls: string[]) => {
    setVideos([...videos, ...urls]);
  };

  const handleVideoDelete = (url: string) => {
    setVideos(videos.filter(u => u !== url));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Имя отправителя</Label>
        <Input 
          value={profile?.full_name || 'Неизвестный продавец'} 
          readOnly 
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label>OPT_ID отправителя</Label>
        <Input 
          value={formData.seller_opt_id || profile?.opt_id || ''} 
          readOnly 
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label>Телеграм отправителя</Label>
        <Input 
          value={profile?.telegram || ''} 
          readOnly 
          className="bg-gray-100"
        />
      </div>

      <div className="space-y-2">
        <Label>Фотографии заказа</Label>
        <ImageUpload
          images={images}
          onUpload={onImageUpload}
          onDelete={onImageDelete}
          maxImages={25}
        />
        {images.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2 mt-4">
            {images.map((url, index) => (
              <div key={index} className="aspect-square rounded-md overflow-hidden">
                <OptimizedProductImage
                  src={url}
                  alt={`Изображение заказа ${index + 1}`}
                  className="w-full h-full"
                  sizes="(max-width: 768px) 33vw, 25vw"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Видео заказа</Label>
        <VideoUpload
          videos={videos}
          onUpload={handleVideoUpload}
          onDelete={handleVideoDelete}
          maxVideos={2}
          storageBucket="order-videos"
          storagePrefix=""
        />
      </div>

      <div className="space-y-2">
        <Label>Способ доставки</Label>
        <Select
          value={formData.deliveryMethod}
          onValueChange={(value: DeliveryMethod) => onInputChange('deliveryMethod', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Выберите способ доставки" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="self_pickup">Самовывоз</SelectItem>
            <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
            <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="place_number">Количество мест для отправки</Label>
        <Input 
          id="place_number" 
          type="number"
          value={formData.place_number}
          onChange={(e) => onInputChange('place_number', e.target.value)}
          required 
          min="1"
          placeholder="Укажите количество мест"
        />
      </div>

      <div className="space-y-2">
        <Label>Дополнительная информация</Label>
        <Textarea 
          placeholder="Укажите дополнительную информацию по заказу (необязательно)"
          className="resize-none"
          rows={3}
          value={formData.text_order}
          onChange={(e) => onInputChange('text_order', e.target.value)}
        />
      </div>
    </div>
  );
};

export default AdditionalInfoStep;
