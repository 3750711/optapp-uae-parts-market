
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { X, Loader2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isImage, isVideo } from "@/utils/imageCompression";
import { processImageForUpload, logImageProcessing } from "@/utils/imageProcessingUtils";

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
  storageBucket,
  storagePrefix = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { toast } = useToast();

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
      
      // First check if user is authenticated
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
        userId: user.id
      });
      
      let completedFiles = 0;
      
      for (const file of files) {
        // Validate file size (limit to 100MB)
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 100) {
          toast({
            title: "Ошибка",
            description: `Файл слишком большой. Максимальный размер 100МБ`,
            variant: "destructive"
          });
          logImageProcessing('FileSizeError', { 
            fileName: file.name, 
            fileSize: `${fileSizeMB.toFixed(2)}MB`
          });
          continue;
        }

        // Process file based on type
        let processedFile = file;
        
        // For images, optimize them
        if (isImage(file)) {
          try {
            const processed = await processImageForUpload(file);
            processedFile = processed.optimizedFile;
          } catch (error) {
            logImageProcessing('ProcessingError', { 
              fileName: file.name,
              error: error.message
            });
            // Continue with the original file if optimization fails
          }
        } else if (isVideo(file)) {
          // Log video file information
          logImageProcessing('VideoFile', { 
            fileName: file.name,
            fileSize: `${fileSizeMB.toFixed(2)}MB`,
            fileType: file.type
          });
        }
        
        // Generate unique filename
        const ext = file.name.split('.').pop();
        const fileName = `${storagePrefix}${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
        
        logImageProcessing('Uploading', { 
          bucket: storageBucket, 
          fileName,
          fileSize: `${(processedFile.size / 1024 / 1024).toFixed(2)}MB`
        });
        
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, processedFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          logImageProcessing('UploadError', {
            fileName: file.name,
            error: error.message
          });
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive"
          });
        } else {
          logImageProcessing('UploadSuccess', { fileName });
          const { data: { publicUrl } } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
        
        // Update progress
        completedFiles++;
        const progressValue = Math.round((completedFiles / files.length) * 100);
        setUploadProgress(progressValue);
        logImageProcessing('UploadProgress', { progress: `${progressValue}%` });
      }
      
      if (uploadedUrls.length > 0) {
        onUpload(uploadedUrls);
        toast({ 
          title: "Видео загружено",
          description: `Успешно загружено: ${uploadedUrls.length} из ${files.length}` 
        });
      }
    } catch (error) {
      logImageProcessing('UnexpectedError', { error: error.message });
      toast({
        title: "Ошибка загрузки",
        description: "Непредвиденная ошибка при загрузке видео",
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
      // Extract file path from URL
      const fileUrl = new URL(url);
      const pathParts = fileUrl.pathname.split('/');
      // The last part after the bucket name should be the file name
      const bucketIndex = pathParts.findIndex(part => part === storageBucket);
      const filePath = bucketIndex >= 0 ? pathParts.slice(bucketIndex + 1).join('/') : '';
      
      if (!filePath) {
        logImageProcessing('DeletePathError', { url });
        toast({
          title: "Ошибка",
          description: "Не удалось определить путь к файлу",
          variant: "destructive"
        });
        return;
      }
      
      logImageProcessing('DeleteFile', { 
        bucket: storageBucket,
        filePath
      });
      
      const { error } = await supabase.storage
        .from(storageBucket)
        .remove([filePath]);
        
      if (error) {
        logImageProcessing('DeleteError', { error: error.message });
        toast({
          title: "Ошибка",
          description: "Не удалось удалить видео",
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
      logImageProcessing('DeleteException', { error: error.message });
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео",
        variant: "destructive"
      });
    }
  };
  
  // Function to trigger file input click
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
        ДО {maxVideos} роликов, до 100 МБ каждый. Поддержка: mp4, mov, avi. Первое видео будет основным.
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
    </div>
  );
};

export default VideoUpload;
