import { useState, useCallback } from 'react';
import { useUploadUIAdapter } from '@/components/uploader/useUploadUIAdapter';

export function useConfirmationUpload(existingUrls?: string[]) {
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>(existingUrls || []);
  
  // Use the upload adapter to track upload states and progress
  const adapter = useUploadUIAdapter({
    existingUrls: existingUrls || [],
    onChange: (urls: string[]) => {
      setConfirmedUrls(urls);
    },
    onComplete: (urls: string[]) => {
      setConfirmedUrls(urls);
    },
    max: 8
  });

  // Track if any uploads are active (compressing, uploading, idle)
  const isUploading = adapter.items.some((item: any) => 
    item.status === 'compressing' || item.status === 'uploading' || item.status === 'idle'
  );

  // Handlers for SimplePhotoUploader compatibility
  const handleChange = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  const handleComplete = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  return {
    confirmedUrls,
    isUploading,
    adapter,
    handleChange,
    handleComplete,
  };
}