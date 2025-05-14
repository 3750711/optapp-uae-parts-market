import React, { useState, useCallback, useEffect } from "react";
import { X, Camera, ImagePlus, Loader2, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  logImageProcessing, 
  optimizeImageForMarketplace, 
  getDeviceCapabilities,
  getPrimaryStorageBucket,
  uploadImageToStorage,
  checkUserUploadPermission
} from "@/utils/imageProcessingUtils";

interface AdminProductImagesManagerProps {
  productId: string;
  images: string[];
  onImagesChange: (urls: string[]) => void;
}

export const AdminProductImagesManager: React.FC<AdminProductImagesManagerProps> = ({
  productId,
  images,
  onImagesChange,
}) => {
  const { toast } = useToast();
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [primaryBucket, setPrimaryBucket] = useState<string>("Product Images");
  const [retryQueue, setRetryQueue] = useState<Array<File>>([]);
  const [hasPermission, setHasPermission] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const deviceCapabilities = getDeviceCapabilities();
  
  // Проверка прав и получение информации о хранилище при инициализации
  useEffect(() => {
    const checkPermissionsAndBuckets = async () => {
      try {
        const bucketName = await getPrimaryStorageBucket();
        setPrimaryBucket(bucketName);
        
        const permissions = await checkUserUploadPermission();
        setHasPermission(permissions.canUpload);
        
        if (!permissions.canUpload && permissions.message) {
          toast({
            title: "Предупреждение",
            description: permissions.message,
            variant: "default", // Changed from "warning" to "default"
          });
        }
        
        logImageProcessing('AdminInitConfig', { 
          primaryBucket: bucketName,
          hasPermission: permissions.canUpload
        });
      } catch (error) {
        logImageProcessing('AdminInitError', { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    
    checkPermissionsAndBuckets();
  }, [toast]);
  
  // Определение, является ли устройство мобильным
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Извлечение информации о хранилище из URL
  const extractStorageInfo = (url: string): { bucket: string, path: string | null } => {
    try {
      if (url.includes('/order-images/')) {
        return {
          bucket: 'order-images',
          path: 'order-images/' + url.split('/').slice(url.split('/').findIndex(p => p === 'order-images') + 1).join('/')
        };
      } else if (url.includes('/product-images/')) {
        return {
          bucket: 'product-images',
          path: 'product-images/' + url.split('/').slice(url.split('/').findIndex(p => p === 'product-images') + 1).join('/')  
        };
      } else if (url.includes('/Product Images/')) {
        return {
          bucket: 'Product Images',
          path: 'Product Images/' + url.split('/').slice(url.split('/').findIndex(p => p === 'Product Images') + 1).join('/')  
        };
      } else {
        // Fallback для стандартных URL Supabase Storage
        const parts = url.split('/');
        const storageIndex = parts.findIndex(p => p === 'storage');
        
        if (storageIndex >= 0 && parts.length > storageIndex + 2) {
          return {
            bucket: parts[storageIndex + 1],
            path: parts.slice(storageIndex + 2).join('/')
          };
        }
        
        return {
          bucket: primaryBucket,
          path: null
        };
      }
    } catch (error) {
      logImageProcessing('ExtractPathError', { url, error });
      return {
        bucket: primaryBucket,
        path: null
      };
    }
  };

  // Удаление изображения
  const handleImageDelete = useCallback(async (url: string) => {
    if (images.length <= 1) {
      toast({
        title: "Внимание",
        description: "Должна остаться хотя бы одна фотография",
        variant: "destructive",
      });
      return;
    }
    
    setDeletingUrl(url);
    try {
      // Извлекаем информацию о хранилище и пути из URL
      const { bucket, path } = extractStorageInfo(url);
      
      if (!path) {
        throw new Error("Не удалось определить путь файла");
      }
      
      logImageProcessing('DeleteImage', { 
        bucket, 
        path,
        productId
      });
      
      // Выполняем несколько попыток удаления с разными именами хранилищ
      let deleted = false;
      const bucketsToTry = [bucket, "Product Images", "product-images"];
      
      for (const bucketName of bucketsToTry) {
        try {
          const { error: storageErr } = await supabase.storage
            .from(bucketName)
            .remove([path]);
            
          if (!storageErr) {
            deleted = true;
            break;
          }
        } catch (bucketError) {
          logImageProcessing('BucketDeleteAttemptFailed', {
            bucket: bucketName,
            error: bucketError instanceof Error ? bucketError.message : String(bucketError)
          });
        }
      }
      
      // Если файл не удалось удалить из хранилища, просто выводим предупреждение
      if (!deleted) {
        logImageProcessing('StorageDeleteFailed', { url });
        toast({
          title: "Предупреждение",
          description: "Не удалось удалить файл из хранилища, но запись будет удалена из базы данных",
          variant: "default", // Changed from "warning" to "default"
        });
      }
      
      // Удаление записи из базы данных
      const { error: dbErr } = await supabase
        .from('product_images')
        .delete()
        .eq('url', url)
        .eq('product_id', productId);
        
      if (dbErr) throw dbErr;
      
      onImagesChange(images.filter(img => img !== url));
      
      toast({ title: "Фото удалено" });
    } catch (error: any) {
      toast({
        title: "Ошибка удаления",
        description: error?.message || "Не удалось удалить фото",
        variant: "destructive",
      });
    } finally {
      setDeletingUrl(null);
    }
  }, [images, productId, onImagesChange, toast, primaryBucket]);

  // Обработка повторных попыток загрузки
  const handleRetryUploads = useCallback(async () => {
    if (!retryQueue.length || isUploading) return;
    
    setIsUploading(true);
    
    try {
      const filesToRetry = [...retryQueue];
      setRetryQueue([]);
      
      logImageProcessing('AdminRetryUploads', { 
        count: filesToRetry.length,
        productId
      });
      
      const newUrls: string[] = [];
      
      for (const file of filesToRetry) {
        try {
          // Оптимизация и загрузка изображения
          const optimizedFile = await optimizeImageForMarketplace(file);
          
          // Загрузка с использованием основного хранилища
          const imageUrl = await uploadImageToStorage(
            optimizedFile,
            primaryBucket,
            `admin-upload-${productId}`
          );
          
          // Сохранение ссылки в базе данных
          const { error: dbError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: imageUrl,
              is_primary: images.length === 0 && newUrls.length === 0 // Первое изображение основное
            });
            
          if (dbError) {
            throw dbError;
          }
          
          newUrls.push(imageUrl);
          
        } catch (error) {
          logImageProcessing('RetryUploadError', {
            fileName: file.name,
            error: error instanceof Error ? error.message : String(error)
          });
          
          toast({
            title: "Ошибка повторной загрузки",
            description: `Не удалось загрузить ${file.name}`,
            variant: "destructive",
          });
        }
      }
      
      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        
        toast({ 
          title: "Успешно", 
          description: `Загружено ${newUrls.length} из ${filesToRetry.length} фото` 
        });
      }
      
    } catch (error) {
      logImageProcessing('RetryUploadsError', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить повторные загрузки",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [retryQueue, isUploading, primaryBucket, productId, images, onImagesChange, toast]);

  // Основная функция загрузки изображений
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    if (!hasPermission) {
      toast({
        title: "Ошибка доступа",
        description: "У вас нет прав на загрузку изображений",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const newUrls: string[] = [];
      const failedFiles: File[] = [];
      
      logImageProcessing('AdminUploadStart', { 
        fileCount: files.length,
        productId
      });
      
      // Ограничиваем количество одновременных операций в зависимости от устройства
      const maxConcurrent = deviceCapabilities.isLowEndDevice ? 1 : 
                           (deviceCapabilities.isMobileDevice ? 2 : 3);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
          logImageProcessing('InvalidFileType', { 
            filename: file.name, 
            type: file.type,
            productId
          });
          toast({
            title: "Ошибка",
            description: `${file.name} не является изображением`,
            variant: "destructive",
          });
          continue;
        }
        
        // Проверяем размер файла
        if (file.size > (deviceCapabilities.isLowEndDevice ? 10 : 25) * 1024 * 1024) {
          const maxSize = deviceCapabilities.isLowEndDevice ? 10 : 25;
          toast({
            title: "Ошибка",
            description: `Файл ${file.name} слишком большой (макс. ${maxSize} МБ)`,
            variant: "destructive",
          });
          continue;
        }
        
        logImageProcessing('ProcessingUpload', { 
          filename: file.name, 
          size: file.size,
          type: file.type,
          productId
        });
        
        try {
          // Оптимизация изображения
          const optimizedFile = await optimizeImageForMarketplace(file);
          
          // Генерация уникального имени файла
          const fileExt = optimizedFile.name.split('.').pop() || 'jpg';
          const uniqueId = `admin-upload-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
          const fileName = `${uniqueId}.${fileExt}`;
          
          // Загрузка в хранилище с использованием улучшенной функции
          const imageUrl = await uploadImageToStorage(
            optimizedFile, 
            primaryBucket, 
            `admin-upload-${productId}`
          );
          
          // Сохранение ссылки в базе данных
          const { error: dbError } = await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              url: imageUrl,
              is_primary: images.length === 0 && newUrls.length === 0 // Первое изображение основное
            });
            
          if (dbError) {
            logImageProcessing('DatabaseError', { 
              productId,
              error: dbError.message
            });
            toast({
              title: "Ошибка сохранения",
              description: dbError.message,
              variant: "destructive",
            });
            failedFiles.push(file);
            continue;
          }
          
          newUrls.push(imageUrl);
          
        } catch (uploadError) {
          logImageProcessing('UploadError', { 
            filename: file.name, 
            error: uploadError instanceof Error ? uploadError.message : String(uploadError),
            productId
          });
          
          toast({
            title: "Ошибка загрузки",
            description: uploadError instanceof Error ? 
                        uploadError.message : 
                        `Не удалось загрузить ${file.name}`,
            variant: "destructive",
          });
          
          failedFiles.push(file);
        }
        
        // Для слабых устройств добавляем задержку между загрузками
        if (deviceCapabilities.isLowEndDevice && i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      if (failedFiles.length > 0) {
        setRetryQueue(prev => [...prev, ...failedFiles]);
      }
      
      if (newUrls.length > 0) {
        onImagesChange([...images, ...newUrls]);
        
        toast({ 
          title: "Успешно", 
          description: `Загружено ${newUrls.length} фото` 
        });
      }
    } catch (error: any) {
      console.error("Error uploading images:", error);
      logImageProcessing('UploadException', { 
        productId,
        error: error?.message || "Unknown error"
      });
      toast({
        title: "Ошибка",
        description: error?.message || "Не удалось загрузить фото",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Сбрасываем input для возможности выбора тех же файлов снова
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [images, productId, onImagesChange, toast, primaryBucket, deviceCapabilities, hasPermission]);

  // Открытие диалога выбора файлов
  const openFileDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  // Открытие камеры на мобильных устройствах
  const openCameraDialog = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  }, []);

  if (!images.length) return null;
  
  return (
    <div className="mb-4">
      <div className="text-xs font-medium mb-1">Фотографии</div>
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, idx) => (
          <div key={img} className="relative group rounded-md overflow-hidden border aspect-square">
            <img 
              src={img} 
              alt={`Фото ${idx + 1}`} 
              className="w-full h-full object-cover" 
              loading="lazy"
              decoding="async"
            />
            <button
              type="button"
              aria-label="Удалить фото"
              className="absolute top-2 right-2 p-1 bg-red-600 bg-opacity-80 rounded-full text-white opacity-80 hover:opacity-100 focus:outline-none focus:ring-2"
              onClick={() => handleImageDelete(img)}
              disabled={deletingUrl === img}
            >
              <X size={16}/>
            </button>
            {idx === 0 && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-1">
                <p className="text-white text-xs text-center">Главное фото</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2 flex-wrap">
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageUpload}
          disabled={isUploading || !hasPermission}
        />
        
        <input
          type="file"
          multiple
          accept="image/*"
          capture="environment"
          className="hidden"
          ref={cameraInputRef}
          onChange={handleImageUpload}
          disabled={isUploading || !hasPermission}
        />
        
        <Button
          type="button"
          variant="outline" 
          size="sm"
          disabled={isUploading || !hasPermission}
          className="flex items-center gap-1 text-xs flex-1"
          onClick={openFileDialog}
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <ImagePlus className="h-3 w-3" />
          )}
          Галерея
        </Button>
        
        {isMobile() && (
          <Button
            type="button"
            variant="outline" 
            size="sm"
            disabled={isUploading || !hasPermission}
            className="flex items-center gap-1 text-xs flex-1"
            onClick={openCameraDialog}
          >
            <Camera className="h-3 w-3" />
            Камера
          </Button>
        )}
        
        {retryQueue.length > 0 && (
          <Button
            type="button"
            variant="secondary" 
            size="sm"
            disabled={isUploading || !hasPermission}
            className="flex items-center gap-1 text-xs flex-1"
            onClick={handleRetryUploads}
          >
            <RefreshCcw className="h-3 w-3" />
            Повторить ({retryQueue.length})
          </Button>
        )}
      </div>
      
      {!hasPermission && (
        <p className="text-xs text-red-500 mt-2">
          У вас нет прав для загрузки изображений
        </p>
      )}
      
      {deviceCapabilities.isLowEndDevice && (
        <p className="text-xs text-amber-600 mt-1">
          Обнаружено устройство с ограниченной мощностью
        </p>
      )}
    </div>
  );
};
