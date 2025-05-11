
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { compressImage } from "@/utils/imageCompression";

interface ImageUploadProps {
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  images: string[];
  maxImages?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onDelete,
  images,
  maxImages = 10
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const newUploadProgress = Array(files.length).fill(0);
      setUploadProgress(newUploadProgress);
      
      const newUrls: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        if (images.length + newUrls.length >= maxImages) {
          toast({
            title: "Предупреждение",
            description: `Достигнуто максимальное количество изображений (${maxImages})`,
          });
          break;
        }
        
        const file = files[i];
        // Проверка размера файла (не более 5 МБ)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} слишком большой. Максимальный размер - 5 МБ`,
            variant: "destructive",
          });
          continue;
        }
        
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} не является изображением`,
            variant: "destructive",
          });
          continue;
        }
        
        // Compress the image
        let compressedFile = file;
        try {
          compressedFile = await compressImage(file, 1024, 768, 0.8);
          console.log(`Image compressed: ${file.size} -> ${compressedFile.size} bytes`);
        } catch (error) {
          console.error("Error compressing image:", error);
          // Continue with the original file if compression fails
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Загрузка файла с обновлением прогресса
        const { error: uploadError, data } = await supabase.storage
          .from('order-images')
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          toast({
            title: "Ошибка",
            description: `Не удалось загрузить ${file.name}: ${uploadError.message}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('order-images')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
        
        // Обновляем прогресс для текущего файла
        newUploadProgress[i] = 100;
        setUploadProgress([...newUploadProgress]);
      }

      if (newUrls.length > 0) {
        onUpload(newUrls);
        toast({
          title: "Успешно",
          description: `Загружено ${newUrls.length} изображений`,
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображение",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress([]);
      // Reset the file input after upload
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (url: string) => {
    try {
      // Extract the filename from the URL
      const pathParts = url.split('/');
      const fileName = pathParts[pathParts.length - 1];
      
      if (fileName) {
        const { error } = await supabase.storage
          .from('order-images')
          .remove([fileName]);
          
        if (error) {
          console.error("Error removing file from storage:", error);
          // Continue with deletion even if storage removal fails
        }
      }
      
      onDelete(url);
      toast({
        title: "Успешно",
        description: "Изображение удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
    }
  };

  // Функция для открытия диалога выбора файла
  const handleChooseImages = () => {
    // Для Android - сначала очищаем input, чтобы сработал onChange даже при выборе тех же файлов
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="relative group aspect-square">
            <img
              src={url}
              alt={`Order image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
            />
            <button
              onClick={() => handleDelete(url)}
              className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-80 hover:opacity-100 transition-opacity"
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        {/* Показываем индикаторы загрузки */}
        {isUploading && uploadProgress.map((progress, index) => (
          <div key={`progress-${index}`} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <span className="text-sm text-gray-500 mt-2">{progress}%</span>
            </div>
          </div>
        ))}
        
        {images.length < maxImages && (
          <div 
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={handleChooseImages}
          >
            <div className="text-3xl text-gray-300">+</div>
            <p className="text-sm text-gray-500">Добавить фото</p>
          </div>
        )}
      </div>

      {images.length < maxImages && (
        <div className="flex items-center">
          <input
            type="file"
            id="images"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={uploadImages}
            disabled={isUploading}
          />
          <Button 
            type="button"
            variant="outline"
            disabled={isUploading}
            className="flex items-center gap-2 w-full md:w-auto"
            onClick={handleChooseImages}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              <>
                <ImagePlus className="h-4 w-4" />
                Добавить фото
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
