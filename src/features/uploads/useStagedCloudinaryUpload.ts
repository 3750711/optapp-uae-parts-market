import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { UploadItem } from './types';
import imageCompression from 'browser-image-compression';

type ProgressCb = (patch: Partial<UploadItem> & { id: string }) => void;

export function useStagedCloudinaryUpload() {
  const uploadFiles = useCallback(
    async (files: File[], onProgress: ProgressCb): Promise<UploadItem[]> => {
      const items: UploadItem[] = files.map((f) => ({
        id: uuid(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        progress: 0,
        status: 'idle' as const,
      }));

      for (const item of items) {
        try {
          onProgress({ id: item.id, status: 'compressing', progress: 5 });
          
          // Compress image
          const compressed = await imageCompression(item.file!, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });

          onProgress({ id: item.id, status: 'uploading', progress: 10 });
          
          // Upload to Cloudinary via Edge Function
          const formData = new FormData();
          formData.append('file', compressed);

          const { data: result, error } = await supabase.functions.invoke('cloudinary-upload', {
            body: formData,
          });

          if (error || !result?.success || !result?.mainImageUrl) {
            throw new Error(error?.message || result?.error || 'Upload failed');
          }

          onProgress({ 
            id: item.id, 
            status: 'completed', 
            progress: 100, 
            url: result.mainImageUrl 
          });
        } catch (e: any) {
          onProgress({
            id: item.id,
            status: 'error',
            error: e?.message ?? 'Upload failed',
          });
        }
      }

      return items;
    },
    []
  );

  return { uploadFiles };
}