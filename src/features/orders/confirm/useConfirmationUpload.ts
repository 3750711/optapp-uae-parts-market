import { useState, useCallback } from 'react';

export function useConfirmationUpload() {
  const [confirmedUrls, setConfirmedUrls] = useState<string[]>([]);

  // вызывается на любой апдейт uploader-а
  const handleChange = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  // когда все активные завершены
  const handleComplete = useCallback((urls: string[]) => {
    setConfirmedUrls(urls);
  }, []);

  return {
    confirmedUrls,
    handleChange,
    handleComplete,
  };
}