import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PRODUCTION_DOMAIN } from '@/utils/seoUtils';

export const usePublicProfileShare = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const { toast } = useToast();

  const generatePublicLink = async (profileId: string) => {
    try {
      setIsGenerating(true);
      
      // Regenerate profile share token
      const { data, error } = await supabase
        .rpc('regenerate_profile_share_token', {
          p_profile_id: profileId
        });

      if (error) {
        console.error('Error generating profile token:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать публичную ссылку",
          variant: "destructive",
        });
        return null;
      }

      const publicUrl = `${PRODUCTION_DOMAIN}/public-profile/${data}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(publicUrl);
      
      toast({
        title: "Успешно!",
        description: "Публичная ссылка создана и скопирована в буфер обмена",
      });

      return publicUrl;
    } catch (error) {
      console.error('Error generating public link:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать публичную ссылку",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const disablePublicAccess = async (profileId: string) => {
    try {
      setIsDisabling(true);
      
      const { error } = await supabase
        .rpc('disable_profile_public_access', {
          p_profile_id: profileId
        });

      if (error) {
        console.error('Error disabling public access:', error);
        toast({
          title: "Ошибка", 
          description: "Не удалось отключить публичный доступ",
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Успешно!",
        description: "Публичный доступ отключен",
      });

      return true;
    } catch (error) {
      console.error('Error disabling public access:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось отключить публичный доступ", 
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDisabling(false);
    }
  };

  const getShareUrls = (publicUrl: string) => {
    const message = `Посмотрите мой каталог автозапчастей: ${publicUrl}`;
    
    return {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(publicUrl)}&text=${encodeURIComponent('Каталог автозапчастей')}`,
      copy: publicUrl
    };
  };

  return {
    generatePublicLink,
    disablePublicAccess,
    getShareUrls,
    isGenerating,
    isDisabling,
  };
};