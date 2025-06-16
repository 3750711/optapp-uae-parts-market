
import { useState, useCallback, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSimpleOrderMediaUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  const uploadFiles = useCallback(async (files: File[], orderId?: string): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    abortController.current = new AbortController();
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Сжатие изображения
        const compressedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1024,
          initialQuality: 0.85,
          fileType: 'image/webp',
          useWebWorker: true,
          preserveExif: false
        });

        // Создание FormData
        const formData = new FormData();
        formData.append('file', compressedFile, compressedFile.name);
        if (orderId) {
          formData.append('orderId', orderId);
        }

        // Загрузка в Cloudinary
        const { data: result, error } = await supabase.functions.invoke('cloudinary-upload', {
          body: formData,
        });

        if (error || !result?.success || !result?.mainImageUrl) {
          throw new Error(result?.error || 'Ошибка загрузки');
        }

        uploadedUrls.push(result.mainImageUrl);
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Фото загружены",
          description: `Загружено ${uploadedUrls.length} фото`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить фото",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const cancelUpload = useCallback(() => {
    abortController.current?.abort();
    setIsUploading(false);
  }, []);

  return {
    uploadFiles,
    isUploading,
    cancelUpload
  };
};
