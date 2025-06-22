
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { toast } from '@/hooks/use-toast';

export const useConfirmationUpload = () => {
  const { user, isAdmin } = useAuth();
  const [isUploading, setIsUploading] = useState(false);

  const uploadConfirmationImages = useCallback(async (orderId: string, files: File[]) => {
    if (!isAdmin || !user) {
      toast({
        title: "Ошибка доступа",
        description: "У вас нет прав для загрузки изображений",
        variant: "destructive",
      });
      return false;
    }

    setIsUploading(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const fileName = `${orderId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('order-confirmations')
          .upload(fileName, file);

        if (error) throw error;
        return data.path;
      });

      const uploadedPaths = await Promise.all(uploadPromises);

      // Update order with confirmation image paths
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          confirmation_images: uploadedPaths,
          status: 'confirmed'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({
        title: "Изображения загружены",
        description: "Изображения подтверждения успешно загружены",
      });

      return true;
    } catch (error) {
      console.error('Error uploading confirmation images:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Не удалось загрузить изображения",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [user, isAdmin]);

  return {
    uploadConfirmationImages,
    isUploading
  };
};
