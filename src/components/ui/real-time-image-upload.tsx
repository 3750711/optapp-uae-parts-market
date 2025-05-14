import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera, Trash2, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  validateImageForMarketplace, 
  uploadImageToStorage, 
  logImageProcessing,
  getDeviceCapabilities 
} from "@/utils/imageProcessingUtils";
import { isImage } from "@/utils/imageCompression";

interface RealtimeImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket: string;
  storagePath?: string;
}

export function RealtimeImageUpload({
  onUploadComplete,
  maxImages = 10,
  storageBucket,
  storagePath = "",
}: RealtimeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const deviceCapabilities = getDeviceCapabilities();
  
  // Проверка, является ли устройство мобильным
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  const handleRemoveImage = (fileId: string, imageUrl: string) => {
    // Удаляем из отслеживания прогресса
    const newProgress = { ...uploadProgress };
    delete newProgress[fileId];
    setUploadProgress(newProgress);

    // Удаляем из загруженных изображений
    const newUploadedImages = { ...uploadedImages };
    delete newUploadedImages[fileId];
    setUploadedImages(newUploadedImages);
    
    // Удаляем из ошибок, если они были
    const newErrors = { ...uploadErrors };
    delete newErrors[fileId];
    setUploadErrors(newErrors);
    
    // Уведомляем родительский компонент
    onUploadComplete(Object.values(newUploadedImages));
  };

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      const newUploadProgress: Record<string, number> = {};
      const newUploadErrors: Record<string, string> = {};
      const fileIds = Array.from(files).map((_, idx) => `file-${Date.now()}-${idx}`);
      
      fileIds.forEach(id => {
        newUploadProgress[id] = 0;
      });
      
      setUploadProgress(prev => ({...prev, ...newUploadProgress}));
      
      const newUploadedImages: Record<string, string> = { ...uploadedImages };
      
      // Используем константу с корректным именем бакета для всех операций
      const correctBucketName = "product-images";
      
      logImageProcessing('RealtimeUploadStart', { 
        fileCount: files.length, 
        bucket: correctBucketName,
        specifiedBucket: storageBucket,
        deviceInfo: deviceCapabilities
      });
      
      // Определяем максимальное число одновременно обрабатываемых файлов
      // в зависимости от возможностей устройства
      const maxConcurrent = deviceCapabilities.isLowEndDevice ? 1 : 2;
      
      for (let i = 0; i < files.length; i++) {
        const fileId = fileIds[i];
        const file = files[i];
        
        // Обновляем прогресс
        newUploadProgress[fileId] = 10;
        setUploadProgress(prev => ({...prev, ...newUploadProgress}));
        
        // Проверяем файл на соответствие требованиям маркетплейса
        const validation = validateImageForMarketplace(file);
        if (!validation.isValid) {
          toast({
            title: "Ошибка",
            description: validation.errorMessage,
            variant: "destructive",
          });
          
          newUploadProgress[fileId] = -1; // Отмечаем как ошибку
          newUploadErrors[fileId] = validation.errorMessage || "Ошибка проверки изображения";
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          setUploadErrors(prev => ({...prev, ...newUploadErrors}));
          continue;
        }
        
        try {
          // Обновляем прогресс
          newUploadProgress[fileId] = 25;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Загружаем изображение с правильным именем бакета
          const imageUrl = await uploadImageToStorage(file, correctBucketName, storagePath);
          
          // Обновляем прогресс
          newUploadProgress[fileId] = 100;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Сохраняем URL загруженного изображения
          newUploadedImages[fileId] = imageUrl;
          
          // Логируем успех
          logImageProcessing('RealtimeUploadSuccess', { imageUrl });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          logImageProcessing('RealtimeUploadError', {
            fileName: file.name,
            error: errorMessage
          });
          
          newUploadProgress[fileId] = -1; // Отмечаем как ошибку
          newUploadErrors[fileId] = errorMessage;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          setUploadErrors(prev => ({...prev, ...newUploadErrors}));
          
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
        
        // Для слабых устройств добавляем искусственную задержку между обработкой файлов,
        // чтобы избежать перегрузки и зависания
        if (deviceCapabilities.isLowEndDevice && i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const finalUrls = Object.values(newUploadedImages);
      if (finalUrls.length > 0) {
        setUploadedImages(newUploadedImages);
        onUploadComplete(finalUrls);
        
        toast({
          title: "Успешно",
          description: `Загружено ${Object.keys(newUploadedImages).length - Object.keys(uploadedImages).length} изображений`,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки изображений:', error);
      logImageProcessing('UnexpectedError', { error: error instanceof Error ? error.message : String(error) });
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить изображения. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [onUploadComplete, storageBucket, storagePath, uploadedImages, deviceCapabilities]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Загруженные изображения */}
        {Object.entries(uploadedImages).map(([fileId, imageUrl]) => (
          <div key={fileId} className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => handleRemoveImage(fileId, imageUrl)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {/* Индикаторы прогресса загрузки */}
        {Object.entries(uploadProgress).map(([id, progress]) => (
          progress !== 100 && progress !== -1 && (
            <div key={id} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                <span className="text-xs text-gray-500 mt-1">{progress}%</span>
              </div>
            </div>
          )
        ))}
        
        {/* Отображение ошибок загрузки */}
        {Object.entries(uploadErrors).map(([id, errorMessage]) => (
          <div key={`error-${id}`} className="aspect-square bg-red-50 rounded-lg flex items-center justify-center p-2">
            <div className="text-center">
              <AlertCircle className="h-6 w-6 mx-auto text-red-500" />
              <span className="text-xs text-red-500 mt-1 line-clamp-3">{errorMessage}</span>
            </div>
          </div>
        ))}
        
        {/* Кнопки загрузки */}
        {Object.keys(uploadedImages).length < maxImages && (
          <div 
            className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-6 w-6 text-gray-400" />
            <p className="text-xs text-gray-500 mt-1">Загрузить</p>
          </div>
        )}
      </div>

      {/* Скрытые input для выбора файлов */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
      
      {isMobile() && (
        <input
          type="file"
          ref={cameraInputRef}
          multiple
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
      )}
      
      {/* Кнопки действий */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading || Object.keys(uploadedImages).length >= maxImages}
          className="flex items-center gap-1"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Загрузка...</span>
            </>
          ) : (
            <>
              <ImagePlus className="h-3 w-3" />
              <span>Из галереи</span>
            </>
          )}
        </Button>
        
        {isMobile() && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading || Object.keys(uploadedImages).length >= maxImages}
            className="flex items-center gap-1"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-3 w-3" />
            <span>Сделать фото</span>
          </Button>
        )}
      </div>
      
      {deviceCapabilities.isLowEndDevice && (
        <p className="text-xs text-amber-600">
          Обнаружено устройство с ограниченной производительностью. Загрузка и обработка изображений может занять больше времени.
        </p>
      )}
    </div>
  );
}
