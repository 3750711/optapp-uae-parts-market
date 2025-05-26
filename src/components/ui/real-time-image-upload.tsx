import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera, Trash2, AlertCircle, RefreshCcw, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  validateImageForMarketplace, 
  uploadImageToStorage, 
  logImageProcessing,
  getDeviceCapabilities,
  getPrimaryStorageBucket,
  checkUserUploadPermission
} from "@/utils/imageProcessingUtils";
import { isImage } from "@/utils/imageCompression";

interface RealtimeImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxImages?: number;
  storageBucket?: string;
  storagePath?: string;
  onPrimaryImageChange?: (primaryUrl: string) => void;
  primaryImage?: string;
}

export function RealtimeImageUpload({
  onUploadComplete,
  maxImages = 25,
  storageBucket,
  storagePath = "",
  onPrimaryImageChange,
  primaryImage
}: RealtimeImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedImages, setUploadedImages] = useState<Record<string, string>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [retryQueue, setRetryQueue] = useState<Array<{fileId: string, file: File}>>([]);
  const [primaryBucket, setPrimaryBucket] = useState<string>("Product Images");
  const [userPermissions, setUserPermissions] = useState<{canUpload: boolean, message?: string}>({ canUpload: true });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const deviceCapabilities = getDeviceCapabilities();

  // Update local state when primaryImage prop changes
  useEffect(() => {
    if (primaryImage && Object.values(uploadedImages).includes(primaryImage)) {
      // No need to update state as the primary image is already set from props
      console.log("Primary image set from props:", primaryImage);
    }
  }, [primaryImage, uploadedImages]);
  
  // Получение основного имени бакета при загрузке компонента
  useEffect(() => {
    const fetchStorageConfig = async () => {
      try {
        const bucketName = await getPrimaryStorageBucket();
        setPrimaryBucket(bucketName);
        
        const permissions = await checkUserUploadPermission();
        setUserPermissions(permissions);
        
        if (!permissions.canUpload && permissions.message) {
          toast({
            title: "Предупреждение",
            description: permissions.message,
            variant: "default", // Changed from "warning" to "default"
          });
        }
        
        logImageProcessing('StorageConfigLoaded', { 
          primaryBucket: bucketName,
          userPermissions: permissions
        });
      } catch (error) {
        logImageProcessing('StorageConfigError', { 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    };
    
    fetchStorageConfig();
  }, []);
  
  // Проверка, является ли устройство мобильным
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Set an image as primary
  const setPrimaryImage = useCallback((imageUrl: string) => {
    if (onPrimaryImageChange) {
      onPrimaryImageChange(imageUrl);
    }
  }, [onPrimaryImageChange]);

  // Функция для повторной попытки загрузки файлов с ошибками
  const handleRetryFailedUploads = useCallback(async () => {
    if (retryQueue.length === 0 || isUploading) return;
    
    setIsUploading(true);
    
    const filesToRetry = [...retryQueue];
    setRetryQueue([]); // Очищаем очередь на повторную загрузку
    
    try {
      const newUploadProgress: Record<string, number> = {};
      const newUploadErrors: Record<string, string> = {};
      const newUploadedImages = { ...uploadedImages };
      
      logImageProcessing('RetryUploadsStart', { 
        filesCount: filesToRetry.length
      });
      
      for (const { fileId, file } of filesToRetry) {
        try {
          newUploadProgress[fileId] = 10;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          newUploadProgress[fileId] = 25;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Используем основное хранилище
          const imageUrl = await uploadImageToStorage(
            file, 
            storageBucket || primaryBucket, 
            storagePath
          );
          
          // Обновляем прогресс
          newUploadProgress[fileId] = 100;
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          
          // Сохраняем URL загруженного изображения
          newUploadedImages[fileId] = imageUrl;
          
          logImageProcessing('RetryUploadSuccess', { imageUrl });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          logImageProcessing('RetryUploadError', {
            fileName: file.name,
            error: errorMessage
          });
          
          newUploadProgress[fileId] = -1; // Отмечаем как ошибку
          newUploadErrors[fileId] = errorMessage;
          
          toast({
            title: "Ошибка при повторной загрузке",
            description: `Не удалось загрузить ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
        
        // Обновляем состояния после каждого файла
        setUploadProgress(prev => ({...prev, ...newUploadProgress}));
        setUploadErrors(prev => ({...prev, ...newUploadErrors}));
      }
      
      setUploadedImages(newUploadedImages);
      onUploadComplete(Object.values(newUploadedImages));
      
      const successCount = filesToRetry.length - Object.keys(newUploadErrors).length;
      if (successCount > 0) {
        toast({
          title: "Успешно",
          description: `Загружено ${successCount} из ${filesToRetry.length} изображений`,
        });
      }
    } catch (error) {
      logImageProcessing('RetryUploadsError', { 
        error: error instanceof Error ? error.message : String(error)
      });
      
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить повторную загрузку изображений",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [retryQueue, isUploading, uploadedImages, onUploadComplete, storageBucket, primaryBucket, storagePath]);

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
    
    // Удаляем из очереди на повторную попытку
    setRetryQueue(prev => prev.filter(item => item.fileId !== fileId));
    
    // If we're removing the primary image, select a new one or clear it
    if (primaryImage === imageUrl && onPrimaryImageChange) {
      const remainingImages = Object.values(newUploadedImages);
      if (remainingImages.length > 0) {
        onPrimaryImageChange(remainingImages[0]);
      } else {
        onPrimaryImageChange("");
      }
    }
    
    // Уведомляем родительский компонент об актуальном списке изображений
    onUploadComplete(Object.values(newUploadedImages));
  };

  // Enhanced mobile-friendly device capabilities detection
  const getEnhancedDeviceCapabilities = useCallback(() => {
    const memory = (navigator as any).deviceMemory || 4;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEndDevice = memory <= 2;
    const isBudgetDevice = memory <= 4;

    return {
      memory,
      isLowEndDevice,
      isOlderIOS: /iPhone|iPad|iPod/.test(navigator.userAgent) && parseInt((navigator.userAgent.match(/OS (\d+)_/) || [])[1] || '15') < 14,
      isOlderAndroid: /Android/.test(navigator.userAgent) && parseInt((navigator.userAgent.match(/Android (\d+)/) || [])[1] || '10') < 8,
      isMobileDevice: isMobile,
      isBudgetDevice,
      hasWebWorkerIssues: isLowEndDevice || isMobile,
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      isMobileChromeWithLimits: isMobile && /Chrome/.test(navigator.userAgent),
      isLimitedBrowser: isLowEndDevice || (isMobile && memory <= 3),
      hasWeakConnection: (navigator as any).connection?.effectiveType?.includes('2g') || 
                         (navigator as any).connection?.downlink < 1,
      userAgent: navigator.userAgent.toLowerCase(),
      connectionInfo: (navigator as any).connection ? 
        `${(navigator as any).connection.effectiveType} - ${(navigator as any).connection.downlink}Mbps` : 
        'not available'
    };
  }, []);

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || isUploading) return;
    
    // Проверяем права пользователя
    if (!userPermissions.canUpload) {
      toast({
        title: "Нет доступа",
        description: userPermissions.message || "У вас нет прав для загрузки изображений",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const files = Array.from(event.target.files);
      const enhancedCapabilities = getEnhancedDeviceCapabilities();
      
      const newUploadProgress: Record<string, number> = {};
      const newUploadErrors: Record<string, string> = {};
      const fileIds = files.map((_, idx) => `file-${Date.now()}-${idx}`);
      
      fileIds.forEach(id => {
        newUploadProgress[id] = 0;
      });
      
      setUploadProgress(prev => ({...prev, ...newUploadProgress}));
      
      const newUploadedImages: Record<string, string> = { ...uploadedImages };
      const newRetryQueue: Array<{fileId: string, file: File}> = [];
      
      logImageProcessing('RealtimeUploadStart', { 
        fileCount: files.length, 
        bucket: storageBucket || primaryBucket,
        deviceInfo: enhancedCapabilities
      });
      
      // Определяем стратегию загрузки на основе возможностей устройства
      const uploadStrategy = {
        sequential: enhancedCapabilities.isMobileDevice || enhancedCapabilities.isLowEndDevice,
        batchSize: enhancedCapabilities.isLowEndDevice ? 1 : (enhancedCapabilities.isMobileDevice ? 2 : 3),
        delay: enhancedCapabilities.isLowEndDevice ? 1200 : (enhancedCapabilities.isMobileDevice ? 800 : 300),
        compressionQuality: enhancedCapabilities.isLowEndDevice ? 0.4 : (enhancedCapabilities.isMobileDevice ? 0.6 : 0.8),
        maxResolution: enhancedCapabilities.isMobileDevice ? 1280 : 1920
      };

      // Сжатие изображений для мобильных устройств
      const compressImageForMobile = async (file: File): Promise<File> => {
        if (!enhancedCapabilities.isMobileDevice) return file;

        return new Promise((resolve) => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          
          img.onload = () => {
            let { width, height } = img;
            const maxDim = uploadStrategy.maxResolution;
            
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = (height * maxDim) / width;
                width = maxDim;
              } else {
                width = (width * maxDim) / height;
                height = maxDim;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            
            canvas.toBlob((blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            }, 'image/jpeg', uploadStrategy.compressionQuality);
          };
          
          img.src = URL.createObjectURL(file);
        });
      };

      // Обработка файлов с учетом стратегии загрузки
      if (uploadStrategy.sequential) {
        // Последовательная загрузка для мобильных устройств
        for (let i = 0; i < files.length; i++) {
          const fileId = fileIds[i];
          const file = files[i];
          
          // Проверяем максимальное количество изображений
          if (Object.keys(uploadedImages).length + Object.keys(newUploadedImages).length - Object.keys(uploadedImages).length >= maxImages) {
            toast({
              title: "Предупреждение",
              description: `Достигнуто максимальное количество изображений (${maxImages})`,
              variant: "default",
            });
            break;
          }
          
          try {
            // Обновляем прогресс
            newUploadProgress[fileId] = 10;
            setUploadProgress(prev => ({...prev, ...newUploadProgress}));
            
            // Проверяем файл на соответствие требованиям
            const validation = validateImageForMarketplace(file);
            if (!validation.isValid) {
              throw new Error(validation.errorMessage || "Ошибка проверки изображения");
            }
            
            // Сжимаем для мобильных
            const processedFile = await compressImageForMobile(file);
            
            newUploadProgress[fileId] = 40;
            setUploadProgress(prev => ({...prev, ...newUploadProgress}));
            
            // Загружаем изображение
            const imageUrl = await uploadImageToStorage(
              processedFile, 
              storageBucket || primaryBucket, 
              storagePath
            );
            
            newUploadProgress[fileId] = 100;
            setUploadProgress(prev => ({...prev, ...newUploadProgress}));
            
            newUploadedImages[fileId] = imageUrl;
            
            logImageProcessing('RealtimeUploadSuccess', { 
              imageUrl,
              originalSize: file.size,
              compressedSize: processedFile.size,
              compressionRatio: Math.round((1 - processedFile.size / file.size) * 100)
            });
            
            // Задержка между файлами для освобождения памяти
            if (i < files.length - 1) {
              await new Promise(resolve => setTimeout(resolve, uploadStrategy.delay));
            }
            
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            logImageProcessing('RealtimeUploadError', {
              fileName: file.name,
              error: errorMessage
            });
            
            newUploadProgress[fileId] = -1;
            newUploadErrors[fileId] = errorMessage;
            newRetryQueue.push({ fileId, file });
            
            toast({
              title: "Ошибка загрузки",
              description: `${file.name}: ${errorMessage}`,
              variant: "destructive",
            });
          }
          
          // Обновляем состояние после каждого файла
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          setUploadErrors(prev => ({...prev, ...newUploadErrors}));
        }
      } else {
        // Batch загрузка для десктопа (существующая логика)
        const batchSize = 3;
        const newUploadProgress: Record<string, number> = {};
        const newUploadErrors: Record<string, string> = {};
        const fileIds = files.map((_, idx) => `file-${Date.now()}-${idx}`);
        
        fileIds.forEach(id => {
          newUploadProgress[id] = 0;
        });
        
        setUploadProgress(prev => ({...prev, ...newUploadProgress}));
        
        const newUploadedImages: Record<string, string> = { ...uploadedImages };
        const newRetryQueue: Array<{fileId: string, file: File}> = [];
        
        logImageProcessing('RealtimeUploadStart', { 
          fileCount: files.length, 
          bucket: storageBucket || primaryBucket,
          deviceInfo: deviceCapabilities
        });
        
        for (let i = 0; i < files.length; i += batchSize) {
          const batch = files.slice(i, i + batchSize);
          
          // Process each file in the batch
          const uploadPromises = batch.map(async (file, index) => {
            const fileId = fileIds[i + index];
            
            // Проверяем максимальное количество изображений
            if (Object.keys(uploadedImages).length + Object.keys(newUploadedImages).length - Object.keys(uploadedImages).length >= maxImages) {
              toast({
                title: "Предупреждение",
                description: `Достигнуто максимальное количество изображений (${maxImages})`,
                variant: "default",
              });
              return;
            }
            
            try {
              // Обновляем прогресс
              newUploadProgress[fileId] = 10;
              setUploadProgress(prev => ({...prev, ...newUploadProgress}));
              
              // Проверяем файл на соответствие требованиям
              const validation = validateImageForMarketplace(file);
              if (!validation.isValid) {
                throw new Error(validation.errorMessage || "Ошибка проверки изображения");
              }
              
              // Обновляем прогресс
              newUploadProgress[fileId] = 25;
              setUploadProgress(prev => ({...prev, ...newUploadProgress}));
              
              // Загружаем изображение
              const imageUrl = await uploadImageToStorage(
                file, 
                storageBucket || primaryBucket, 
                storagePath
              );
              
              // Обновляем прогресс
              newUploadProgress[fileId] = 100;
              setUploadProgress(prev => ({...prev, ...newUploadProgress}));
              
              newUploadedImages[fileId] = imageUrl;
              
              logImageProcessing('RealtimeUploadSuccess', { imageUrl });
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              
              logImageProcessing('RealtimeUploadError', {
                fileName: file.name,
                error: errorMessage
              });
              
              newUploadProgress[fileId] = -1;
              newUploadErrors[fileId] = errorMessage;
              newRetryQueue.push({ fileId, file });
              
              toast({
                title: "Ошибка загрузки",
                description: `${file.name}: ${errorMessage}`,
                variant: "destructive",
              });
            }
          });
          
          // Wait for all uploads in the batch to complete
          await Promise.all(uploadPromises);
          
          // Add a delay between batches to avoid overloading the server
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Обновляем состояние после каждого пакета
          setUploadProgress(prev => ({...prev, ...newUploadProgress}));
          setUploadErrors(prev => ({...prev, ...newUploadErrors}));
        }
      }

      // Обновляем финальные состояния
      setUploadedImages(newUploadedImages);
      
      if (newRetryQueue.length > 0) {
        setRetryQueue(prev => [...prev, ...newRetryQueue]);
      }
      
      const successCount = Object.values(newUploadProgress).filter(progress => progress === 100).length;
      if (successCount > 0) {
        onUploadComplete(Object.values(newUploadedImages));
        
        toast({
          title: "Успешно",
          description: enhancedCapabilities.isMobileDevice 
            ? `Загружено и оптимизировано ${successCount} из ${files.length} изображений`
            : `Загружено ${successCount} из ${files.length} изображений`,
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
  }, [onUploadComplete, storageBucket, storagePath, uploadedImages, maxImages, primaryBucket, userPermissions, onPrimaryImageChange, primaryImage, getEnhancedDeviceCapabilities]);

  return (
    <div className="space-y-4">
      {!userPermissions.canUpload && userPermissions.message && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {userPermissions.message}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
        {/* Загруженные изображения */}
        {Object.entries(uploadedImages).map(([fileId, imageUrl]) => (
          <div key={fileId} className={`aspect-square bg-gray-100 rounded-lg overflow-hidden relative group ${primaryImage === imageUrl ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}>
            <img 
              src={imageUrl} 
              alt="Uploaded" 
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-2">
              {onPrimaryImageChange && (
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-8 w-8"
                  title="Сделать основным фото"
                  onClick={() => setPrimaryImage(imageUrl)}
                  disabled={primaryImage === imageUrl}
                >
                  <Check className={`h-4 w-4 ${primaryImage === imageUrl ? 'text-blue-500' : ''}`} />
                </Button>
              )}
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => handleRemoveImage(fileId, imageUrl)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {primaryImage === imageUrl && (
              <div className="absolute bottom-0 left-0 right-0 bg-blue-500 bg-opacity-70 p-1">
                <p className="text-white text-xs text-center">Основное фото</p>
              </div>
            )}
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
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isUploading || Object.keys(uploadedImages).length >= maxImages || !userPermissions.canUpload}
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
            disabled={isUploading || Object.keys(uploadedImages).length >= maxImages || !userPermissions.canUpload}
            className="flex items-center gap-1"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-3 w-3" />
            <span>Сделать фото</span>
          </Button>
        )}
        
        {retryQueue.length > 0 && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isUploading || !userPermissions.canUpload}
            className="flex items-center gap-1"
            onClick={handleRetryFailedUploads}
          >
            <RefreshCcw className="h-3 w-3" />
            <span>Повторить ({retryQueue.length})</span>
          </Button>
        )}
      </div>
      
      {deviceCapabilities.isLowEndDevice && (
        <p className="text-xs text-amber-600">
          Обнаружено устройство с ограниченной производительностью. Загрузка и обработка изображений может занять больше времени.
        </p>
      )}
      
      {primaryBucket !== storageBucket && storageBucket && (
        <p className="text-xs text-gray-500">
          Используется хранилище: {storageBucket}
        </p>
      )}
      
      {maxImages > 10 && (
        <p className="text-xs text-gray-500">
          Вы можете загрузить до {maxImages} изображений
        </p>
      )}
    </div>
  );
}
