
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useConfirmationUpload = (
  open: boolean, 
  orderId: string, 
  onComplete: () => void,
  mode: 'all' | 'images-only' = 'all'
) => {
  const { isAdmin, user, profile } = useAuth();
  
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const [confirmVideos, setConfirmVideos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isUploading = isSaving;

  // Initialize component readiness
  useEffect(() => {
    if (open && user) {
      setIsComponentReady(true);
      setSessionLost(false);
    }
  }, [open, user]);

  // Check for session loss
  useEffect(() => {
    if (open && !user) {
      setSessionLost(true);
      setIsComponentReady(false);
    }
  }, [open, user]);

  const handleImagesUpload = useCallback((urls: string[]) => {
    setConfirmImages(urls);
    setUploadError(null);
  }, []);

  const handleVideosUpload = useCallback((urls: string[]) => {
    setConfirmVideos(urls);
    setUploadError(null);
  }, []);

  const handleImageDelete = useCallback((url: string) => {
    setConfirmImages(prev => prev.filter(imageUrl => imageUrl !== url));
  }, []);

  const handleVideoDelete = useCallback((url: string) => {
    setConfirmVideos(prev => prev.filter(videoUrl => videoUrl !== url));
  }, []);

  const handleSaveMedia = useCallback(async () => {
    if (!user || confirmImages.length === 0) {
      setUploadError('No images to upload');
      return;
    }

    try {
      setIsSaving(true);
      setUploadError(null);

      // Create individual rows for each image URL
      const imageRows = confirmImages.map(url => ({
        order_id: orderId,
        url: url
      }));

      // Insert all image URLs as separate rows
      const { error } = await supabase
        .from('confirm_images')
        .insert(imageRows);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      const successMessage = mode === 'images-only' 
        ? 'Your confirmation screenshot has been saved successfully.'
        : 'Confirmation media uploaded successfully';

      toast.success(successMessage);
      onComplete();
      handleReset();
    } catch (error) {
      console.error('Error uploading media:', error);
      setUploadError('Failed to save media. Please try again.');
      toast.error('Failed to save media');
    } finally {
      setIsSaving(false);
    }
  }, [user, confirmImages, orderId, onComplete, mode]);

  const handleSessionRecovery = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionLost(false);
        setIsComponentReady(true);
      }
    } catch (error) {
      console.error('Session recovery failed:', error);
      setSessionLost(true);
    }
  }, []);

  const handleReset = useCallback(() => {
    setConfirmImages([]);
    setConfirmVideos([]);
    setUploadError(null);
    setIsSaving(false);
  }, []);

  return {
    // Admin status (for compatibility)
    isAdmin: isAdmin === true,
    hasAdminAccess: isAdmin === true,
    isCheckingAdmin: isAdmin === null && !!user,
    
    // Upload state
    confirmImages,
    confirmVideos,
    isUploading,
    uploadError,
    isComponentReady,
    sessionLost,
    
    // Upload handlers
    handleImagesUpload,
    handleVideosUpload,
    handleImageDelete,
    handleVideoDelete,
    handleSaveMedia,
    handleSessionRecovery,
    handleReset
  };
};
