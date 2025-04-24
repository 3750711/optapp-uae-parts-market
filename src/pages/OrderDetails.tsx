import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { OrderConfirmationCard } from '@/components/order/OrderConfirmationCard';
import { toast } from '@/hooks/use-toast';
import { OrderImages } from '@/components/order/OrderImages';
import { OrderVideos } from '@/components/order/OrderVideos';
import { Database } from '@/integrations/supabase/types';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import OrderPriceConfirmDialog from '@/components/order/OrderPriceConfirmDialog';

type OrderWithBuyer = Database['public']['Tables']['orders']['Row'] & {
  buyer: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      console.log("Fetching order details for ID:", id);
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          ),
          seller:profiles!orders_seller_id_fkey (
            telegram,
            full_name,
            opt_id,
            email,
            phone
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (orderError) {
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить данные заказа",
          variant: "destructive",
        });
        throw orderError;
      }

      if (!order) return null;
      console.log("Fetched order data:", order);
      console.log("Order", order.order_number, "text_order:", order.text_order);

      let images: string[] = [];
      let videos: string[] = [];

      if (order.images && Array.isArray(order.images) && order.images.length > 0) {
        images = order.images;
      } else {
        const { data: imagesFromTable, error: imagesError } = await supabase
          .from('order_images')
          .select('url')
          .eq('order_id', id);

        if (imagesError) throw imagesError;
        images = imagesFromTable?.map(img => img.url) || [];
      }

      const { data: videosFromTable, error: videosError } = await supabase
        .from('order_videos')
        .select('url')
        .eq('order_id', id);

      if (videosError) {
        videos = [];
      } else {
        videos = videosFromTable?.map((v) => v.url) || [];
      }

      return {
        order,
        images,
        videos,
      };
    },
    enabled: !!id
  });

  const handleSellerConfirm = async (newPrice: number) => {
    if (!orderData?.order || isUpdating) return;
    setIsUpdating(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: 'seller_confirmed',
          price: newPrice
        })
        .eq('id', orderData.order.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось подтвердить заказ",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Заказ подтвержден",
        description: "Статус заказа успешно обновлен",
      });

      queryClient.setQueryData(['order', id], {
        order: { ...orderData.order, status: 'seller_confirmed', price: newPrice },
        images: orderData.images,
        videos: orderData.videos,
      });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
    } finally {
      setIsUpdating(false);
      setIsPriceDialogOpen(false);
    }
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

  const isSeller = profile?.user_type === 'seller' && orderData.order.seller_id === user?.id;
  const canConfirm = isSeller && orderData.order.status === 'created';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <OrderConfirmationCard
          order={orderData.order}
          images={orderData.images}
          videos={orderData.videos}
          onOrderUpdate={(updatedOrder) => {
            if (orderData?.order) {
              const preservedFields = {
                telegram_url_order: orderData.order.telegram_url_order,
                buyer_opt_id: orderData.order.buyer_opt_id,
                text_order: orderData.order.text_order,
              };
              const mergedOrder = { ...preservedFields, ...updatedOrder };
              queryClient.setQueryData(['order', id], {
                order: mergedOrder,
                images: orderData.images,
                videos: orderData.videos,
              });
            }
            queryClient.invalidateQueries({ queryKey: ['order', id] });
          }}
        />

        {canConfirm && (
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={() => {
                console.log("Opening price dialog with price:", orderData?.order?.price);
                setIsPriceDialogOpen(true);
              }}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 mr-2" />
                  Подтверждение...
                </>
              ) : (
                <>Подтвердить заказ</>
              )}
            </Button>
          </div>
        )}

        <OrderPriceConfirmDialog
          open={isPriceDialogOpen}
          onOpenChange={setIsPriceDialogOpen}
          currentPrice={orderData?.order?.price || 0}
          onConfirm={handleSellerConfirm}
          isSubmitting={isUpdating}
        />

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Фотографии заказа</h2>
          <OrderImages images={orderData.images} />
        </div>
        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Видео заказа</h2>
          <OrderVideos videos={orderData.videos} />
        </div>
      </div>
    </Layout>
  );
};

export default OrderDetails;
