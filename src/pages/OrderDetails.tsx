
import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { OrderConfirmationCard } from '@/components/order/OrderConfirmationCard';

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (orderError) throw orderError;
      if (!order) return null;

      const { data: images, error: imagesError } = await supabase
        .from('order_images')
        .select('url')
        .eq('order_id', id);

      if (imagesError) throw imagesError;

      console.log('Order data fetched:', order);
      console.log('Buyer OPT ID:', order.buyer_opt_id);

      return {
        order,
        images: images?.map(img => img.url) || []
      };
    },
    enabled: !!id
  });

  const handleOrderUpdate = (updatedOrder: any) => {
    // Make sure buyer_opt_id is preserved when updating
    if (orderData?.order && !updatedOrder.buyer_opt_id) {
      updatedOrder.buyer_opt_id = orderData.order.buyer_opt_id;
    }
    
    // Invalidate the query to refetch the updated data
    queryClient.invalidateQueries({ queryKey: ['order', id] });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow" />
        </div>
      </Layout>
    );
  }

  if (!orderData?.order) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Заказ не найден</h1>
            <p className="mt-2 text-gray-600">
              Запрошенный заказ не существует или был удален
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <OrderConfirmationCard
          order={orderData.order}
          images={orderData.images}
          onOrderUpdate={handleOrderUpdate}
        />
      </div>
    </Layout>
  );
};

export default OrderDetails;
