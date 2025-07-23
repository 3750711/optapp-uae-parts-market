
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useOrderVideoFix = () => {
  const [isFixing, setIsFixing] = useState(false);

  const fixOrderVideoDuplication = async (orderId: string) => {
    setIsFixing(true);
    try {
      console.log('🔧 Fixing video duplication for order:', orderId);

      // Очищаем поле video_url в таблице orders
      const { error: clearError } = await supabase
        .from('orders')
        .update({ video_url: [] })
        .eq('id', orderId);

      if (clearError) {
        console.error('❌ Error clearing video_url field:', clearError);
        toast({
          title: "Ошибка",
          description: "Не удалось очистить поле video_url в заказе",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Video duplication fixed for order:', orderId);
      toast({
        title: "Успешно",
        description: "Дублирование видео исправлено",
      });
      return true;
    } catch (error) {
      console.error('❌ Error in fixOrderVideoDuplication:', error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при исправлении дублирования видео",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsFixing(false);
    }
  };

  const fixOrderVideo = async (orderId: string, videoUrls: string[]) => {
    setIsFixing(true);
    try {
      console.log('🔧 Fixing order video:', { orderId, videoUrls });

      // Сначала очищаем старые видео
      const { error: deleteError } = await supabase
        .from('order_videos')
        .delete()
        .eq('order_id', orderId);

      if (deleteError) {
        console.error('❌ Error deleting old videos:', deleteError);
        toast({
          title: "Ошибка",
          description: "Не удалось удалить старые видео",
          variant: "destructive",
        });
        return false;
      }

      // Добавляем новые видео
      if (videoUrls.length > 0) {
        const videosToInsert = videoUrls.map(url => ({
          order_id: orderId,
          url: url
        }));

        const { error: insertError } = await supabase
          .from('order_videos')
          .insert(videosToInsert);

        if (insertError) {
          console.error('❌ Error inserting new videos:', insertError);
          toast({
            title: "Ошибка",
            description: "Не удалось добавить новые видео",
            variant: "destructive",
          });
          return false;
        }
      }

      // Очищаем поле video_url в заказе
      const { error: clearError } = await supabase
        .from('orders')
        .update({ video_url: [] })
        .eq('id', orderId);

      if (clearError) {
        console.error('❌ Error clearing video_url field:', clearError);
        // Не фейлим, это не критично
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
    console.log('🔧 Starting to fix specific orders with video duplication');
    
    // Исправляем заказ #7547
    try {
      const { data: order7547, error: orderError } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', 7547)
        .single();

      if (orderError) {
        console.error('❌ Error finding order #7547:', orderError);
      } else {
        await fixOrderVideoDuplication(order7547.id);
      }
    } catch (error) {
      console.error('❌ Error processing order #7547:', error);
    }

    // Исправляем заказ #7545 - добавляем видео из товара
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

    // Исправляем заказ #7546 - добавляем конкретное видео
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
    fixOrderVideoDuplication,
    fixSpecificOrders,
    isFixing
  };
};
