
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { OrderFormData } from '@/hooks/useOrderForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CloudinaryImage from '@/components/ui/CloudinaryImage';
import { Badge } from '@/components/ui/badge';
import { ImageIcon, X, Plus, Upload, Film, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));

    if (imageFiles.length > 0) {
      uploadImagesToCloudinary(imageFiles);
    }

    if (videoFiles.length > 0) {
      uploadVideosToCloudinary(videoFiles);
    }
  };

  const uploadImagesToCloudinary = async (files: File[]) => {
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Замените на ваш upload preset
      
      return fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', { // Замените на ваш cloud name
        method: 'POST',
        body: formData
      }).then(response => response.json());
    });

    try {
      const results = await Promise.all(uploadPromises);
      const urls = results.map(result => result.secure_url);
      onImageUpload(urls);
    } catch (error) {
      console.error('Error uploading images:', error);
      // Здесь можно добавить обработку ошибок, например, показать уведомление
    }
  };

  const uploadVideosToCloudinary = async (files: File[]) => {
    const uploadPromises = files.map(file => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Замените на ваш upload preset
      
      return fetch('https://api.cloudinary.com/v1_1/your-cloud-name/video/upload', { // Замените на ваш cloud name
        method: 'POST',
        body: formData
      }).then(response => response.json());
    });

    try {
      const results = await Promise.all(uploadPromises);
      const urls = results.map(result => result.secure_url);
      onVideoUpload(urls);
    } catch (error) {
      console.error('Error uploading videos:', error);
      // Здесь можно добавить обработку ошибок, например, показать уведомление
    }
  };

  const inputClassName = "transition-all duration-200 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Изображения и видео */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="h-5 w-5 text-purple-600" />
            Медиафайлы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                Загрузка изображений и видео
                <Badge variant="outline" className="text-xs">Рекомендуется</Badge>
              </Label>
              <div>
                <input
                  type="file"
                  id="media-upload"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Загрузить
                </label>
              </div>
            </div>

            {images.length === 0 && videos.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg text-center text-gray-600">
                <div className="flex flex-col items-center gap-2">
                  <Plus className="h-8 w-8 text-gray-400" />
                  <p>Перетащите файлы сюда или нажмите "Загрузить"</p>
                  <input
                    type="file"
                    id="drop-media-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="drop-media-upload"
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Выбрать файлы
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Previews */}
                {images.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Изображения ({images.length})</span>
                    </div>
                    <ScrollArea className="h-40 w-full">
                      <div className="flex flex-wrap gap-3 p-1">
                        {images.map((url, index) => (
                          <div key={index} className="relative group">
                            <CloudinaryImage
                              src={url}
                              alt={`Image ${index + 1}`}
                              width={100}
                              height={100}
                              className="object-cover rounded-md border border-gray-300"
                            />
                            <button
                              type="button"
                              onClick={() => onImageDelete(url)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Delete image"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {videos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Film className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Видео ({videos.length})</span>
                    </div>
                    <ScrollArea className="h-40 w-full">
                      <div className="flex flex-wrap gap-3 p-1">
                        {videos.map((url, index) => (
                          <div key={index} className="relative group flex flex-col items-center bg-gray-100 p-2 rounded-md">
                            <Film className="h-10 w-10 text-gray-500 mb-1" />
                            <span className="text-xs text-gray-700 truncate max-w-[80px]">Видео {index + 1}</span>
                            <button
                              type="button"
                              onClick={() => onVideoDelete(url)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label="Delete video"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                <div className="mt-2">
                  <input
                    type="file"
                    id="additional-media-upload"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                  <label
                    htmlFor="additional-media-upload"
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Добавить ещё файлы
                  </label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Дополнительная информация */}
      <Card className="border-gray-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-amber-600" />
            Дополнительная информация
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text_order" className="text-sm font-medium text-gray-700">
              Комментарий к заказу
            </Label>
            <Textarea 
              id="text_order" 
              value={formData.text_order} 
              onChange={(e) => onInputChange('text_order', e.target.value)}
              placeholder="Напишите дополнительные сведения о заказе"
              rows={5}
              className={inputClassName}
            />
            <p className="text-xs text-gray-500">
              Добавьте любые дополнительные сведения, которые могут быть полезны для обработки заказа
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdditionalInfoStep;
