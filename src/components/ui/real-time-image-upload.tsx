import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, X, Loader2, Camera, Trash2, AlertCircle, RefreshCcw } from "lucide-react";
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
  const [retryQueue, setRetryQueue] = useState<Array<{fileId: string, file: File}>>([]);
  const [primaryBucket, setPrimaryBucket] = useState<string>("Product Images");
  const [userPermissions, setUserPermissions] = useState<{canUpload: boolean, message?: string}>({ canUpload: true });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const deviceCapabilities = getDeviceCapabilities();
  
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
    
    // Уведомляем родительский компонент
    onUploadComplete(Object.values(newUploadedImages));
  };

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || isUploading) return;
    
    // Проверяем права пользователя
    if (!userPermissions.canUpload) {
      toast({
        title: "Нет дос��упа",
        description: userPermissions.message || "У вас нет прав для загрузки изображений",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const files = Array.from(event.target.files);
      
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
      
      // Определяем максимальное число одновременно обрабатываемых файлов
      // в зависимости от возможностей устройства
      const maxConcurrent = deviceCapabilities.isLowEndDevice ? 1 : 
                           (deviceCapabilities.isMobileDevice ? 2 : 3);
      
      for (let i = 0; i < files.length; i++) {
        const fileId = fileIds[i];
        const file = files[i];
        
        // Проверяем максимальное количество изображений
        if (Object.keys(uploadedImages).length + Object.keys(newUploadedImages).length - Object.keys(uploadedImages).length >= maxImages) {
          toast({
            title: "Предупреждение",
            description: `Достигнуто максимальное количество изображений (${maxImages})`,
            variant: "default", // Changed from "warning" to "default"
          });
          break;
        }
        
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
          
          // Загружаем изображение с учетом выбранного хранилища
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
          
          // Добавляем файл в очередь для повторной попытки
          newRetryQueue.push({ fileId, file });
          
          toast({
            title: "Ошибка загрузки",
            description: `Не удалось загрузить ${file.name}: ${errorMessage}`,
            variant: "destructive",
          });
        }
        
        // Для слабых устройств добавляем искусственную задержку между обработкой файлов,
        // чтобы избежать перегрузки и зависания
        if ((deviceCapabilities.isLowEndDevice || deviceCapabilities.isBudgetDevice) && i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Обновляем состояния после обработки всех файлов
      setUploadProgress(prev => ({...prev, ...newUploadProgress}));
      setUploadErrors(prev => ({...prev, ...newUploadErrors}));
      setUploadedImages(newUploadedImages);
      
      if (newRetryQueue.length > 0) {
        setRetryQueue(prev => [...prev, ...newRetryQueue]);
      }
      
      const successCount = Object.values(newUploadProgress).filter(progress => progress === 100).length;
      if (successCount > 0) {
        onUploadComplete(Object.values(newUploadedImages));
        
        toast({
          title: "Успешно",
          description: `Загружено ${successCount} из ${files.length} изображений`,
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
  }, [onUploadComplete, storageBucket, storagePath, uploadedImages, deviceCapabilities, maxImages, primaryBucket, userPermissions]);

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
