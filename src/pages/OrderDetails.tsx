
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { OrderConfirmationCard } from '@/components/order/OrderConfirmationCard';
import { OrderConfirmationImages } from '@/components/order/OrderConfirmationImages';
import { OrderImages } from '@/components/order/OrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Order ID is required');
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:buyer_id(telegram, full_name, opt_id, email, phone),
          seller:seller_id(telegram, full_name, opt_id, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const { data: images = [] } = useQuery({
    queryKey: ['order-images', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    },
    enabled: !!id
  });

  const { data: videos = [] } = useQuery({
    queryKey: ['order-videos', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('order_videos')
        .select('url')
        .eq('order_id', id);

      if (error) throw error;
      return data?.map(video => video.url) || [];
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="text-center text-red-600">
            Заказ не найден или произошла ошибка при загрузке
          </div>
        </div>
      </Layout>
    );
  }

  // Проверяем права доступа к редактированию подтверждающих фото (только для админов)
  const canEditConfirmationImages = user && profile?.user_type === 'admin';

  // Проверяем, является ли пользователь администратором для просмотра подтверждающих фото
  const isAdmin = profile?.user_type === 'admin';

  // Получаем фотографии заказа из поля images
  const orderImages = order.images || [];
  
  // Получаем видео заказа из поля video_url и базы данных
  const allVideos = [...(order.video_url || []), ...videos];

  return (
    <Layout>
      <div className="container mx-auto py-8 space-y-8">
        <OrderConfirmationCard
          order={order}
          images={orderImages}
          videos={allVideos}
        />
        
        {/* Показываем основные фотографии заказа */}
        {orderImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Фотографии заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderImages images={orderImages} />
            </CardContent>
          </Card>
        )}

        {/* Показываем видео заказа с оптимизированным компонентом */}
        {allVideos.length > 0 && (
          <OptimizedOrderVideos 
            videos={allVideos} 
            orderNumber={order.order_number?.toString()}
          />
        )}
        
        {/* Отдельный блок подтверждающих фотографий - только для администраторов */}
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Подтверждающие фотографии</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderConfirmationImages 
                orderId={order.id} 
                canEdit={canEditConfirmationImages}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetails;
