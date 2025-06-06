
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Video, Upload, X, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface VideoUploadProps {
  videos: string[];
  onUpload: (urls: string[]) => void;
  onDelete: (url: string) => void;
  maxVideos?: number;
  storageBucket: string;
  storagePrefix?: string;
  showOnlyButton?: boolean;
  showGalleryOnly?: boolean;
  buttonText?: string;
  buttonIcon?: React.ReactNode;
  className?: string;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  videos,
  onUpload,
  onDelete,
  maxVideos = 3,
  storageBucket = "Product Images",
  storagePrefix = "",
  showOnlyButton = false,
  showGalleryOnly = false,
  buttonText = "Загрузить видео",
  buttonIcon = <Video className="h-4 w-4" />,
  className
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

      for (const file of files) {
        const ext = file.name.split('.').pop();
        const fileName = `${storagePrefix}${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 5)}.${ext}`;
        const { data, error } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) {
          toast({
            title: "Ошибка загрузки",
            description: error.message,
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from(storageBucket)
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrl);
        }
        setUploadProgress(Math.round((uploadedUrls.length / files.length) * 100));
      }

      onUpload(uploadedUrls);
      toast({ title: "Видео загружено", description: "Видео успешно загружено" });
    } catch (error) {
      toast({
        title: "Ошибка загрузки",
        description: "Возникла ошибка при загрузке видео",
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
      const fileUrl = new URL(url);
      const filePath = fileUrl.pathname.slice(1);

      const { error } = await supabase.storage
        .from(storageBucket)
        .remove([filePath]);

      if (error) {
        toast({
          title: "Ошибка",
          description: `Не удалось удалить видео: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      onDelete(url);
      toast({
        title: "Видео удалено",
        description: "Видео было успешно удалено",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео. Попробуйте позже.",
        variant: "destructive"
      });
    }
  };
  
  const handleChooseVideos = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Показывать только кнопку
  if (showOnlyButton) {
    return (
      <div className={cn("w-full", className)}>
        <Button
          type="button"
          variant="outline"
          onClick={handleChooseVideos}
          disabled={uploading || videos.length >= maxVideos}
          className="w-full h-12"
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            buttonIcon
          )}
          {uploading ? `Загрузка... ${uploadProgress}%` : buttonText}
        </Button>
        
        <input
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={uploading}
        />
      </div>
    );
  }

  // Показывать только галерею
  if (showGalleryOnly && videos.length > 0) {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
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
      </div>
    );
  }

  // Полный компонент (по умолчанию)
  return (
    <div className={cn("space-y-2", className)}>
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
              accept="video/*"
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
        ДО {maxVideos} роликов. Поддержка: mp4, mov, avi. Первое видео будет основным.
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
