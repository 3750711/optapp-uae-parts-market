import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const usePublicStoreShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  const generatePublicLink = async (storeId: string) => {
    setIsGenerating(true);
    try {
      // Проверяем существует ли магазин
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('id, name')
        .eq('id', storeId)
        .single();

      if (storeError || !store) {
        throw new Error('Магазин не найден');
      }

      // Вызываем функцию для генерации токена
      const { data, error } = await supabase
        .rpc('regenerate_store_share_token', { store_id: storeId });

      if (error) {
        console.error('Token generation error:', error);
        throw new Error(error.message || 'Ошибка генерации токена');
      }

      const publicUrl = `${window.location.origin}/public-store/${data}`;
      
      toast.success('Публичная ссылка создана!', {
        description: 'Ссылка скопирована в буфер обмена'
      });

      // Копируем в буфер обмена
      try {
        await navigator.clipboard.writeText(publicUrl);
      } catch (clipboardError) {
        console.warn('Failed to copy to clipboard:', clipboardError);
        // Не показываем ошибку пользователю, так как ссылка все равно создана
      }
      
      return {
        token: data,
        url: publicUrl
      };
    } catch (error) {
      console.error('Error generating public link:', error);
      toast.error('Ошибка создания ссылки', {
        description: error.message
      });
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const disablePublicAccess = async (storeId: string) => {
    setIsDisabling(true);
    try {
      const { error } = await supabase
        .rpc('disable_store_public_access', { store_id: storeId });

      if (error) {
        console.error('Disable access error:', error);
        throw new Error(error.message || 'Ошибка отключения доступа');
      }

      toast.success('Публичный доступ отключен');
    } catch (error) {
      console.error('Error disabling public access:', error);
      toast.error('Ошибка отключения доступа', {
        description: error.message
      });
      throw error;
    } finally {
      setIsDisabling(false);
    }
  };

  const getShareUrls = (publicUrl: string) => {
    const text = encodeURIComponent('Посмотрите мой магазин автозапчастей!');
    const url = encodeURIComponent(publicUrl);
    
    return {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      copy: publicUrl
    };
  };

  return {
    generatePublicLink,
    disablePublicAccess,
    getShareUrls,
    isGenerating,
    isDisabling
  };
};