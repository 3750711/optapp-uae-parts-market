
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSimpleOrderUpload = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];

    setIsUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Validate file
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue; // 10MB limit

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload to Cloudinary via Edge Function
        const { data: result, error } = await supabase.functions.invoke('cloudinary-upload', {
          body: formData,
        });

        if (error || !result?.success || !result?.mainImageUrl) {
          console.error('Upload failed:', error || result?.error);
          continue;
        }

        uploadedUrls.push(result.mainImageUrl);
      }

      if (uploadedUrls.length > 0) {
        toast({
          title: "Загрузка завершена",
          description: `Загружено ${uploadedUrls.length} файлов`,
        });
      }

      return uploadedUrls;
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить файлы",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  return {
    uploadFiles,
    isUploading
  };
};
