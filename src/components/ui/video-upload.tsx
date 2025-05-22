
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isVideo } from "@/utils/imageCompression";
import { logImageProcessing, optimizeImageForMarketplace, getDeviceCapabilities } from "@/utils/imageProcessingUtils";

interface VideoUploadProps {
  videos: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxVideos?: number;
  storageBucket: string;
  storagePrefix?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  videos,
  onUpload,
  onDelete,
  maxVideos = 3,
  storageBucket = "Product Images",
  storagePrefix = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();
  const deviceCapabilities = getDeviceCapabilities();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || uploading) return;
    const files = Array.from(e.target.files);
    if (videos.length + files.length > maxVideos) {
      toast({
        title: "Ошибка",
        description: `Максимальное количество видео: ${maxVideos}`,
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const uploadedUrls: string[] = [];
      
      // Сначала проверяем, аутентифицирован ли пользователь
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Ошибка",
          description: "Вы должны быть авторизованы для загрузки видео",
          variant: "destructive"
        });
        setUploading(false);
        return;
      }
      
      logImageProcessing('VideoUploadStart', { 
        fileCount: files.length,
        userId: user.id,
        deviceCapabilities
      });
      
      let completedFiles = 0;
      
      // Исправленное имя bucket - используем "Product Images" вместо original
      const correctedStorageBucket = "Product Images";
      
      // Определяем максимальный размер видео в зависимости от устройства
      const maxVideoSizeMB = deviceCapabilities.isLowEndDevice ? 50 : 100;
      
      for (const file of files) {
        // Проверяем размер файла
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxVideoSizeMB) {
          toast({
            title: "Ошибка",
            description: `Файл слишком большой. Максимальный размер ${maxVideoSizeMB}МБ для вашего устройства`,
            variant: "destructive"
          });
          logImageProcessing('FileSizeError', { 
            fileName: file.name, 
            fileSize: `${fileSizeMB.toFixed(2)}MB`,
            maxSize: `${maxVideoSizeMB}MB`
          });
          continue;
        }

        // Обрабатываем файл в зависимости от типа
        let processedFile = file;
        
        // Для изображений выполняем оптимизацию
        if (file.type.startsWith('image/')) {
          try {
            processedFile = await optimizeImageForMarketplace(file);
          } catch (error) {
            logImageProcessing('ProcessingError', { 
              fileName: file.name,
              error: error instanceof Error ? error.message : String(error)
            });
            // Если оптимизация не удалась, продолжаем с оригинальным файлом
            toast({
              title: "Предупреждение",
              description: `Не удалось оптимизировать изображение ${file.name}. Используется оригинальный файл.`
            });
          }
        } else if (isVideo(file)) {
          // Логируем информацию о видео файле
          logImageProcessing('VideoFile', { 
            fileName: file.name,
            fileSize: `${fileSizeMB.toFixed(2)}MB`,
            fileType: file.type
          });
        }
        
        // Генерируем уникальное имя файла
        const ext = file.name.split('.').pop();
        const fileName = `${storagePrefix}${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
        
        logImageProcessing('Uploading', { 
          bucket: correctedStorageBucket, 
          fileName,
          fileSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
        });
        
        // Загружаем файл в исправленный bucket
        const { data, error } = await supabase.storage
          .from(correctedStorageBucket)
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          logImageProcessing('UploadError', {
            fileName: file.name,
            error: error.message,
            code: error.code,
            details: error.details
          });
          toast({
            title: "Ошибка загрузки",
            description: `${error.message}. Попробуйте файл меньшего размера или другой формат.`,
            variant: "destructive"
          });
        } else {
          logImageProcessing('UploadSuccess', { fileName });
          const { data: { publicUrl } } = supabase.storage
            .from(correctedStorageBucket)
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
        
        // Обновляем прогресс
        completedFiles++;
        const progressValue = Math.round((completedFiles / files.length) * 100);
        setUploadProgress(progressValue);
        logImageProcessing('UploadProgress', { progress: `${progressValue}%` });
        
        // Для слабых устройств добавляем искусственную задержку между файлами
        if (deviceCapabilities.isLowEndDevice && completedFiles < files.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
        toast({ 
          title: "Видео загружено",
          description: `Успешно загружено: ${uploadedUrls.length} из ${files.length}` 
        });
      }
    } catch (error) {
      logImageProcessing('UnexpectedError', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Ошибка загрузки",
        description: "Возникла непредвиденная ошибка при загрузке. Попробуйте позже или используйте файл меньшего размера.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (url: string) => {
    try {
      logImageProcessing('DeleteStart', { url });
      // Извлекаем путь файла из URL
      const fileUrl = new URL(url);
      const pathParts = fileUrl.pathname.split('/');
      
      // Исправленное имя bucket - используем "Product Images" вместо storageBucket
      const correctedBucketName = "Product Images";
      
      // Находим индекс bucket в пути URL
      // Последний сегмент после имени bucket должен быть именем файла
      const bucketIndex = pathParts.findIndex(part => 
        part.toLowerCase() === correctedBucketName.toLowerCase() || 
        part.toLowerCase() === storageBucket.toLowerCase()
      );
      const filePath = bucketIndex >= 0 ? pathParts.slice(bucketIndex + 1).join('/') : '';
      
      if (!filePath) {
        logImageProcessing('DeletePathError', { url });
        toast({
          title: "Ошибка",
          description: "Не удалось определить путь к файлу для удаления",
          variant: "destructive"
        });
        return;
      }
      
      logImageProcessing('DeleteFile', { 
        bucket: correctedBucketName,
        filePath
      });
      
      const { error } = await supabase.storage
        .from(correctedBucketName)
        .remove([filePath]);
        
      if (error) {
        logImageProcessing('DeleteError', { 
          error: error.message,
          code: error.code,
          details: error.details
        });
        toast({
          title: "Ошибка",
          description: `Не удалось удалить видео: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      onDelete(url);
      logImageProcessing('DeleteSuccess', { url });
      toast({
        title: "Видео удалено",
        description: "Видео было успешно удалено",
      });
    } catch (error) {
      logImageProcessing('DeleteException', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео. Попробуйте позже.",
        variant: "destructive"
      });
    }
  };
  
  // Функция для запуска выбора файлов
  const handleChooseVideos = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {videos.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-lg overflow-hidden border">
            <video src={url} controls className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(url)}
              className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {videos.length < maxVideos && (
          <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 aspect-video" onClick={handleChooseVideos}>
            {uploading
              ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="animate-spin h-6 w-6 mb-2" />
                  <span className="text-xs text-gray-500">{uploadProgress}%</span>
                </div>
              ) 
              : (<>
                  <div className="text-2xl text-gray-400 font-bold">+</div>
                  <p className="text-xs text-gray-500">Добавить видео</p>
                </>)
            }
            <input
              type="file"
              accept="video/*,image/*"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500">
        ДО {maxVideos} роликов, до {deviceCapabilities.isLowEndDevice ? "50" : "100"} МБ каждый. Поддержка: mp4, mov, avi. Первое видео будет основным.
      </p>
      
      {videos.length < maxVideos && (
        <Button
          type="button"
          variant="outline"
          onClick={handleChooseVideos}
          disabled={uploading}
          className="flex items-center gap-2 mt-2 w-full md:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Загрузка... {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Выбрать видео
            </>
          )}
        </Button>
      )}
      
      {deviceCapabilities.isLowEndDevice && (
        <p className="text-xs text-amber-600">
          Обнаружено устройство с ограниченной производительностью. Максимальный размер видео ограничен до 50МБ.
        </p>
      )}
    </div>
  );
};

export default VideoUpload;
