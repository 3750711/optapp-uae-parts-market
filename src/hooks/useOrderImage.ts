
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useOrderImage = (orderId: string) => {
  const { data: imageUrl, isLoading } = useQuery({
    queryKey: ['order-primary-image', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      // 1. Попытка получить основное изображение из order_images
      let { data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('is_primary', true)
        .limit(1)
        .single();

      if (data?.url) return data.url;
      if (error && error.code !== 'PGRST116') console.error('Error fetching primary order image:', error);

      // 2. Попытка получить любое изображение из order_images, если основное не найдено
      ({ data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single());

      if (data?.url) return data.url;
      if (error && error.code !== 'PGRST116') console.error('Error fetching first order image:', error);

      // 3. В качестве запасного варианта, попытка получить изображение из confirm_images
      ({ data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .limit(1)
        .single());
      
      if (error && error.code !== 'PGRST116') console.error('Error fetching first confirm image:', error);

      return data?.url || null;
    },
    enabled: !!orderId,
  });

  return { imageUrl, isLoading };
};
