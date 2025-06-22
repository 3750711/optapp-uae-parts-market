
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useProfile } from '@/contexts/ProfileProvider';
import { toast } from '@/hooks/use-toast';

export const useConfirmationUpload = (orderId: string) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [confirmImages, setConfirmImages] = useState<string[]>([]);
  const isAdmin = profile?.user_type === 'admin';

  useEffect(() => {
    if (orderId) {
      fetchConfirmImages();
    }
  }, [orderId]);

  const fetchConfirmImages = async () => {
    try {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (error) throw error;
      setConfirmImages(data?.map(img => img.url) || []);
    } catch (error) {
      console.error('Error fetching confirm images:', error);
    }
  };

  const uploadConfirmImage = async (file: File) => {
    if (!isAdmin) {
      toast({
        title: "Ошибка доступа",
        description: "Только администратор может загружать подтверждающие изображения",
        variant: "destructive",
      });
      return null;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `confirm-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('order-confirmations')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('order-confirmations')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('confirm_images')
        .insert({
          order_id: orderId,
          url: publicUrl,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;

      await fetchConfirmImages();
      
      toast({
        title: "Успех",
        description: "Изображение успешно загружено",
      });

      return publicUrl;
    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    confirmImages,
    uploadConfirmImage,
    fetchConfirmImages,
    isAdmin
  };
};
