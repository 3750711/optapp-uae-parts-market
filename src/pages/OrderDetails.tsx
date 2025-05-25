import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { OrderConfirmationCard } from '@/components/order/OrderConfirmationCard';
import { OptimizedOrderImages } from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { OrderQuickActions } from '@/components/order/OrderQuickActions';
import { OrderBreadcrumbs } from '@/components/order/OrderBreadcrumbs';
import { toast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import OrderPriceConfirmDialog from '@/components/order/OrderPriceConfirmDialog';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

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

const OrderDetailsSkeleton = () => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-6">
      {/* Breadcrumbs skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Quick actions skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className={`flex gap-2 ${isMobile ? 'flex-wrap' : 'flex-wrap md:flex-nowrap'}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className={`h-10 ${isMobile ? 'flex-1 min-w-[100px]' : 'w-32'}`} />
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Order card skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Images skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);

  const { data: orderData, isLoading, refetch } = useQuery({
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
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (replaced cacheTime)
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
      
      // Send notification about order status change with images
      try {
        const notificationResult = await supabase.functions.invoke('send-telegram-notification', {
          body: { 
            order: { 
              ...orderData.order, 
              status: 'seller_confirmed', 
              price: newPrice, 
              images: orderData.images 
            },
            action: 'status_change'
          }
        });
        
        console.log("Status update notification result:", notificationResult);
      } catch (notifyError) {
        console.error('Failed to send status notification:', notifyError);
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
        <div className="container mx-auto px-4 py-8">
          <OrderDetailsSkeleton />
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

  const isSeller = profile?.user_type === 'seller' && orderData?.order?.seller_id === user?.id;
  const canConfirm = isSeller && orderData?.order?.status === 'created';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <OrderBreadcrumbs 
          orderNumber={orderData.order.order_number}
          orderTitle={orderData.order.title}
        />
        
        <OrderQuickActions 
          order={orderData.order}
          onRefresh={() => refetch()}
        />

        <div className="space-y-8">
          <OrderConfirmationCard
            order={orderData?.order}
            images={orderData?.images || []}
            videos={orderData?.videos || []}
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
                
                // Send notification about order update
                try {
                  supabase.functions.invoke('send-telegram-notification', {
                    body: { 
                      order: { ...mergedOrder, images: orderData.images },
                      action: 'status_change'
                    }
                  });
                } catch (error) {
                  console.error('Failed to send update notification:', error);
                }
              }
              queryClient.invalidateQueries({ queryKey: ['order', id] });
            }}
          />

          {canConfirm && (
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  console.log("Opening price dialog with price:", orderData?.order?.price);
                  setIsPriceDialogOpen(true);
                }}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3"
                size={isMobile ? "default" : "lg"}
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

          <OptimizedOrderImages 
            images={orderData?.images || []} 
            orderNumber={orderData.order.order_number?.toString()}
          />
          
          <OptimizedOrderVideos 
            videos={orderData?.videos || []}
            orderNumber={orderData.order.order_number?.toString()}
          />
        </div>

        <OrderPriceConfirmDialog
          open={isPriceDialogOpen}
          onOpenChange={setIsPriceDialogOpen}
          currentPrice={orderData?.order?.price || 0}
          onConfirm={handleSellerConfirm}
          isSubmitting={isUpdating}
        />
      </div>
    </Layout>
  );
};

export default OrderDetails;
