
import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { optimizeImage } from "@/utils/imageCompression";

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
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Check if device is mobile
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const uploadImages = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
        // Проверка размера файла (не более 25 МБ)
        if (file.size > 25 * 1024 * 1024) {
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} слишком большой. Максимальный размер - 25 МБ`,
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
        
        // Optimize the image with WebP support
        let optimizedFile = file;
        try {
          optimizedFile = await optimizeImage(file);
          console.log(`Image optimized: ${file.size} -> ${optimizedFile.size} bytes`);
        } catch (error) {
          console.error("Error optimizing image:", error);
          // Continue with the original file if optimization fails
        }
        
        const fileExt = optimizedFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Update progress for current file
        newUploadProgress[i] = 30; // Show some progress as optimization completed
        setUploadProgress([...newUploadProgress]);

        // Upload file with progress tracking
        const { error: uploadError, data } = await supabase.storage
          .from('order-images')
          .upload(filePath, optimizedFile, {
            cacheControl: '3600',
            contentType: optimizedFile.type,
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
      // Reset the file inputs after upload
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [images, maxImages, onUpload]);

  const handleDelete = useCallback(async (url: string) => {
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
  }, [onDelete]);

  // Функция для открытия диалога выбора файла из галереи
  const handleChooseFromGallery = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  // Функция для открытия камеры
  const handleOpenCamera = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((url, index) => (
          <div key={`${url}-${index}`} className="relative group aspect-square">
            <img
              src={url}
              alt={`Order image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
              decoding="async"
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
            onClick={handleChooseFromGallery}
          >
            <div className="text-3xl text-gray-300">+</div>
            <p className="text-sm text-gray-500">Добавить фото</p>
          </div>
        )}
      </div>

      {images.length < maxImages && (
        <>
          {/* Скрытые input'ы для выбора изображений */}
          <input
            type="file"
            id="gallery-images"
            ref={fileInputRef}
            multiple
            accept="image/*"
            className="hidden"
            onChange={uploadImages}
            disabled={isUploading}
          />
          <input
            type="file"
            id="camera-images"
            ref={cameraInputRef}
            multiple
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={uploadImages}
            disabled={isUploading}
          />
          
          <div className="flex items-center gap-2">
            <Button 
              type="button"
              variant="outline"
              disabled={isUploading}
              className="flex items-center gap-2 flex-1"
              onClick={handleChooseFromGallery}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                <>
                  <ImagePlus className="h-4 w-4" />
                  Галерея
                </>
              )}
            </Button>
            
            {isMobile() && (
              <Button 
                type="button"
                variant="outline"
                disabled={isUploading}
                className="flex items-center gap-2 flex-1"
                onClick={handleOpenCamera}
              >
                <Camera className="h-4 w-4" />
                Камера
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

