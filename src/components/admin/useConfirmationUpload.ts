
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';

export const useConfirmationUpload = (open: boolean, orderId: string, onComplete: () => void) => {
  const { user, profile } = useAuth();
  const isAdmin = profile?.user_type === 'admin';
  
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const [confirmVideos, setConfirmVideos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [sessionLost, setSessionLost] = useState(false);

  // Initialize component when dialog opens
  useEffect(() => {
    if (open && isAdmin && user) {
      setIsComponentReady(true);
      setSessionLost(false);
      setUploadError(null);
      loadExistingMedia();
    } else if (open && !isAdmin) {
      setSessionLost(true);
      setIsComponentReady(false);
    } else {
      setIsComponentReady(false);
      setSessionLost(false);
    }
  }, [open, isAdmin, user, orderId]);

  const loadExistingMedia = useCallback(async () => {
    try {
      // Load existing confirmation images
      const { data: images, error: imagesError } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (imagesError) throw imagesError;
      setConfirmImages(images?.map(img => img.url) || []);

      // Load existing order videos
      const { data: videos, error: videosError } = await supabase
        .from('order_videos')
        .select('url')
        .eq('order_id', orderId);

      if (videosError) throw videosError;
      setConfirmVideos(videos?.map(video => video.url) || []);
    } catch (error) {
      console.error('Error loading existing media:', error);
      setUploadError('Не удалось загрузить существующие файлы');
    }
  }, [orderId]);

  const handleImagesUpload = useCallback(async (files: File[]) => {
    if (!isAdmin || !user) {
      setUploadError('У вас нет прав для загрузки изображений');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload images to Cloudinary or your storage
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'optapp_unsigned');
        formData.append('folder', `orders/${orderId}/confirmation`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dcuziurrb/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setConfirmImages(prev => [...prev, ...uploadedUrls]);

      toast({
        title: "Изображения загружены",
        description: `Загружено ${uploadedUrls.length} изображений`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      setUploadError('Не удалось загрузить изображения');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображения",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [isAdmin, user, orderId]);

  const handleVideosUpload = useCallback(async (files: File[]) => {
    if (!isAdmin || !user) {
      setUploadError('У вас нет прав для загрузки видео');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Upload videos to Cloudinary
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'optapp_unsigned');
        formData.append('folder', `orders/${orderId}/confirmation`);
        formData.append('resource_type', 'video');

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/dcuziurrb/video/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return data.secure_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setConfirmVideos(prev => [...prev, ...uploadedUrls]);

      toast({
        title: "Видео загружены",
        description: `Загружено ${uploadedUrls.length} видео`,
      });
    } catch (error) {
      console.error('Error uploading videos:', error);
      setUploadError('Не удалось загрузить видео');
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить видео",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [isAdmin, user, orderId]);

  const handleImageDelete = useCallback(async (urlToDelete: string) => {
    if (!isAdmin || !user) return;

    try {
      // Remove from database if it exists
      await supabase
        .from('confirm_images')
        .delete()
        .eq('order_id', orderId)
        .eq('url', urlToDelete);

      setConfirmImages(prev => prev.filter(url => url !== urlToDelete));

      toast({
        title: "Изображение удалено",
        description: "Изображение успешно удалено",
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить изображение",
        variant: "destructive",
      });
    }
  }, [isAdmin, user, orderId]);

  const handleVideoDelete = useCallback(async (urlToDelete: string) => {
    if (!isAdmin || !user) return;

    try {
      // Remove from database if it exists
      await supabase
        .from('order_videos')
        .delete()
        .eq('order_id', orderId)
        .eq('url', urlToDelete);

      setConfirmVideos(prev => prev.filter(url => url !== urlToDelete));

      toast({
        title: "Видео удалено",
        description: "Видео успешно удалено",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить видео",
        variant: "destructive",
      });
    }
  }, [isAdmin, user, orderId]);

  const handleSaveMedia = useCallback(async () => {
    if (!isAdmin || !user) {
      setUploadError('У вас нет прав для сохранения файлов');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Save images to database
      if (confirmImages.length > 0) {
        const imageInserts = confirmImages.map(url => ({
          order_id: orderId,
          url
        }));

        const { error: imagesError } = await supabase
          .from('confirm_images')
          .upsert(imageInserts, { onConflict: 'order_id,url' });

        if (imagesError) throw imagesError;
      }

      // Save videos to database
      if (confirmVideos.length > 0) {
        const videoInserts = confirmVideos.map(url => ({
          order_id: orderId,
          url
        }));

        const { error: videosError } = await supabase
          .from('order_videos')
          .upsert(videoInserts, { onConflict: 'order_id,url' });

        if (videosError) throw videosError;
      }

      toast({
        title: "Файлы сохранены",
        description: "Все файлы успешно сохранены",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving media:', error);
      setUploadError('Не удалось сохранить файлы');
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить файлы",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [isAdmin, user, orderId, confirmImages, confirmVideos, onComplete]);

  const handleSessionRecovery = useCallback(() => {
    if (user && isAdmin) {
      setSessionLost(false);
      setIsComponentReady(true);
      setUploadError(null);
      loadExistingMedia();
    }
  }, [user, isAdmin, loadExistingMedia]);

  const handleReset = useCallback(() => {
    setConfirmImages([]);
    setConfirmVideos([]);
    setUploadError(null);
    setIsUploading(false);
  }, []);

  return {
    confirmImages,
    confirmVideos,
    isUploading,
    uploadError,
    isComponentReady,
    sessionLost,
    handleImagesUpload,
    handleVideosUpload,
    handleVideoDelete,
    handleImageDelete,
    handleSaveMedia,
    handleSessionRecovery,
    handleReset
  };
};
