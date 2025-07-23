
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useOrderVideoFix = () => {
  const [isFixing, setIsFixing] = useState(false);

  const fixOrderVideo = async (orderId: string, videoUrls: string[]) => {
    setIsFixing(true);
    try {
      console.log('🔧 Fixing order video:', { orderId, videoUrls });

      const { data, error } = await supabase.rpc('update_order_media', {
        p_order_id: orderId,
        p_images: null, // Don't change images
        p_video_url: videoUrls
      });

      if (error) {
        console.error('❌ Error fixing order video:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось обновить видео в заказе",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Order video fixed successfully');
      toast({
        title: "Успешно",
        description: "Видео в заказе обновлено",
      });
      return true;
    } catch (error) {
      console.error('❌ Error in fixOrderVideo:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при обновлении видео",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsFixing(false);
    }
  };

  const fixSpecificOrders = async () => {
    console.log('🔧 Starting to fix specific orders #7545 and #7546');
    
    // Fix order #7545 - get video from product ce59d464-8409-45e0-96ea-e5fc5efdc1cd
    try {
      const { data: product7545, error: productError } = await supabase
        .from('products')
        .select('product_videos(*)')
        .eq('id', 'ce59d464-8409-45e0-96ea-e5fc5efdc1cd')
        .single();

      if (productError) {
        console.error('❌ Error getting product for order #7545:', productError);
      } else if (product7545?.product_videos?.length > 0) {
        const videoUrls = product7545.product_videos.map(v => v.url);
        console.log('🎬 Found videos for order #7545:', videoUrls);
        
        const { data: order7545, error: orderError } = await supabase
          .from('orders')
          .select('id')
          .eq('order_number', 7545)
          .single();

        if (orderError) {
          console.error('❌ Error finding order #7545:', orderError);
        } else {
          await fixOrderVideo(order7545.id, videoUrls);
        }
      }
    } catch (error) {
      console.error('❌ Error processing order #7545:', error);
    }

    // Fix order #7546 - add specific video URL
    try {
      const videoUrl = 'https://res.cloudinary.com/dcuziurrb/video/upload/q_auto:good/videos/video_1753269866598_1753269866598_rgkx12';
      console.log('🎬 Adding video to order #7546:', videoUrl);
      
      const { data: order7546, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', 7546)
        .single();

      if (orderError) {
        console.error('❌ Error finding order #7546:', orderError);
      } else {
        await fixOrderVideo(order7546.id, [videoUrl]);
      }
    } catch (error) {
      console.error('❌ Error processing order #7546:', error);
    }
  };

  return {
    fixOrderVideo,
    fixSpecificOrders,
    isFixing
  };
};
