
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrderConfirmationUpload } from '@/hooks/useOrderConfirmationUpload';

export const useConfirmationUpload = (
  open: boolean, 
  orderId: string, 
  onComplete: () => void,
  mode: 'all' | 'images-only' = 'all',
  category?: 'chat_screenshot' | 'signed_product'
) => {
  const { isAdmin, user, profile } = useAuth();
  
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const [confirmVideos, setConfirmVideos] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use new upload system with auto-save to database
  const { 
    uploadFiles, 
    items: uploadItems,
    isUploading: isCloudinaryUploading,
    clearStaging 
  } = useOrderConfirmationUpload({ orderId, category });

  const isUploading = isSaving || isCloudinaryUploading;
  
  // Map upload items to progress format
  const uploadProgress = uploadItems.map(item => ({
    fileId: item.id,
    fileName: item.file.name,
    progress: item.progress,
    status: (item.status === 'compressing' || item.status === 'signing') ? 'processing' as const : 
            (item.status === 'pending') ? 'pending' as const :
            (item.status === 'uploading') ? 'uploading' as const :
            (item.status === 'success') ? 'success' as const : 'error' as const,
    error: item.error
  }));

  // Function to get existing images by category
  const getImagesByCategory = useCallback(async (targetCategory: 'chat_screenshot' | 'signed_product') => {
    if (!orderId) return [];
    
    try {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('category', targetCategory);
      
      if (error) throw error;
      return data?.map(item => item.url) || [];
    } catch (error) {
      console.error('Error fetching images by category:', error);
      return [];
    }
  }, [orderId]);

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
    // Note: Images are now auto-saved during upload via useOrderConfirmationUpload
    // This function now just validates and closes the dialog
    
    if (!user || confirmImages.length === 0) {
      setUploadError('No images to upload');
      return;
    }

    // Validate category limits (8 images per category)
    if (category && confirmImages.length > 8) {
      setUploadError(`Maximum 8 images allowed per category. You have ${confirmImages.length} images.`);
      toast.error(`Maximum 8 images allowed per category`);
      return;
    }

    try {
      setIsSaving(true);
      setUploadError(null);

      const successMessage = mode === 'images-only' 
        ? 'Your confirmation screenshot has been saved successfully.'
        : 'Confirmation media uploaded successfully';

      toast.success(successMessage);
      onComplete();
      handleReset();
    } catch (error) {
      console.error('Error:', error);
      setUploadError('Failed to complete. Please try again.');
      toast.error('Failed to complete');
    } finally {
      setIsSaving(false);
    }
  }, [user, confirmImages, onComplete, mode, category]);

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
    clearStaging();
  }, [clearStaging]);

  // Handler for direct file upload (now auto-saves to DB)
  const handleFilesUpload = useCallback(async (files: File[]) => {
    try {
      setUploadError(null);
      console.log('📤 Admin uploading', files.length, 'files');
      
      // uploadFiles now automatically saves to database via useOrderConfirmationUpload
      const urls = await uploadFiles(files);
      
      // Update local state for display
      setConfirmImages(prev => [...prev, ...urls]);
    } catch (error) {
      console.error('File upload error:', error);
      setUploadError('Failed to upload files. Please try again.');
      toast.error('Failed to upload files');
    }
  }, [uploadFiles]);

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
    uploadProgress,
    
    // Upload handlers
    handleImagesUpload,
    handleVideosUpload,
    handleImageDelete,
    handleVideoDelete,
    handleSaveMedia,
    handleSessionRecovery,
    handleReset,
    handleFilesUpload,
    getImagesByCategory
  };
};
