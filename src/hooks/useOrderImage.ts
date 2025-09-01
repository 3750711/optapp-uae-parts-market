
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractPublicIdFromUrl, getOrderImageUrl } from "@/utils/cloudinaryUtils";

export const useOrderImage = (orderId: string, size: 'thumbnail' | 'card' | 'detail' | 'compressed' = 'thumbnail') => {
  const { data: imageUrl, isLoading } = useQuery({
    queryKey: ['order-primary-image', orderId, size],
    queryFn: async () => {
      if (!orderId) return null;

      const getOptimizedUrl = (rawUrl: string | null) => {
        if (!rawUrl) return null;
        if (rawUrl.includes('res.cloudinary.com')) {
          const publicId = extractPublicIdFromUrl(rawUrl);
          if (publicId) {
            return getOrderImageUrl(publicId, size);
          }
        }
        return rawUrl;
      };

      // 1. Сначала проверяем orders.images (основной источник изображений)
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('images')
        .eq('id', orderId)
        .maybeSingle();

      if (orderData?.images && orderData.images.length > 0 && orderData.images[0]) {
        return getOptimizedUrl(orderData.images[0]);
      }
      if (orderError && orderError.code !== 'PGRST116') {
        console.error('Error fetching from orders.images:', orderError);
      }

      // 2. Попытка получить основное изображение из order_images
      let { data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', orderId)
        .eq('is_primary', true)
        .limit(1)
        .maybeSingle();

      if (data?.url) return getOptimizedUrl(data.url);

      // 3. Попытка получить любое изображение из order_images, если основное не найдено
      ({ data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle());

      if (data?.url) return getOptimizedUrl(data.url);

      // 4. В качестве запасного варианта, попытка получить изображение из confirm_images
      ({ data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle());

      return getOptimizedUrl(data?.url || null);
    },
    enabled: !!orderId,
    staleTime: 5 * 60 * 1000, // 5 минут кэширования
    gcTime: 10 * 60 * 1000, // 10 минут в памяти
  });

  return { imageUrl, isLoading };
};
