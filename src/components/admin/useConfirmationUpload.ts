
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isDeleting, setIsDeleting] = useState(false);

  const isUploading = isSaving;

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

  // Load existing images when dialog opens
  useEffect(() => {
    if (open && orderId && category && user) {
      const loadExistingImages = async () => {
        try {
          const existingImages = await getImagesByCategory(category);
          setConfirmImages(existingImages);
        } catch (error) {
          console.error('Error loading existing images:', error);
        }
      };
      loadExistingImages();
    }
  }, [open, orderId, category, user, getImagesByCategory]);

  const handleImagesUpload = useCallback((urls: string[]) => {
    // SimplePhotoUploader sends array of URLs directly, append to existing
    setConfirmImages(prev => [...prev, ...urls]);
    setUploadError(null);
  }, []);

  const handleImageDelete = useCallback(async (urlToDelete: string) => {
    if (!orderId || !urlToDelete) {
      console.error('Missing orderId or urlToDelete');
      return;
    }

    try {
      setIsDeleting(true);
      setUploadError(null);

      // Delete from database
      const { error } = await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', urlToDelete);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Update local state only after successful database deletion
      setConfirmImages(prev => prev.filter(url => url !== urlToDelete));
      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      setUploadError('Failed to delete image. Please try again.');
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  }, [orderId]);

  const handleVideosUpload = useCallback((urls: string[]) => {
    setConfirmVideos(urls);
    setUploadError(null);
  }, []);

  const handleVideoDelete = useCallback((url: string) => {
    setConfirmVideos(prev => prev.filter(videoUrl => videoUrl !== url));
  }, []);

  const handleSaveMedia = useCallback(async () => {
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

      // Create individual rows for each image URL
      const imageRows = confirmImages.map(url => ({
        order_id: orderId,
        url: url,
        category: category || null
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
  }, [user, confirmImages, orderId, onComplete, mode, category]);

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
    confirmImages,
    confirmVideos,
    uploadError,
    isComponentReady,
    sessionLost,
    isSaving,
    isUploading,
    isDeleting,
    handleImagesUpload,
    handleImageDelete,
    handleVideosUpload,
    handleVideoDelete,
    handleSaveMedia,
    handleSessionRecovery,
    handleReset,
    getImagesByCategory,
  };
};
