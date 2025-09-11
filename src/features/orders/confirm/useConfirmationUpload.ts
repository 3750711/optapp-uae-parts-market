import { useState, useCallback } from 'react';

export function useConfirmationUpload(existingUrls?: string[]) {
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>(existingUrls || []);

  // Handlers for SimplePhotoUploader compatibility
  const handleChange = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  const handleComplete = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  return {
    confirmedUrls,
    handleChange,
    handleComplete,
  };
}