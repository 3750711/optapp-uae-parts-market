
import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Package, PackageCheck, PackageX, Truck, CalendarClock, Check } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderConfirmButton } from '@/components/order/OrderConfirmButton';
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';

const statusColors = {
  created: 'bg-gray-100 text-gray-800',
  seller_confirmed: 'bg-blue-100 text-blue-800',
  admin_confirmed: 'bg-purple-100 text-purple-800',
  processed: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusIcons = {
  created: <CalendarClock className="w-5 h-5 text-gray-400" />,
  seller_confirmed: <Check className="w-5 h-5 text-blue-500" />,
  admin_confirmed: <PackageCheck className="w-5 h-5 text-purple-500" />,
  processed: <Package className="w-5 h-5 text-yellow-500" />,
  shipped: <Truck className="w-5 h-5 text-orange-500" />,
  delivered: <PackageCheck className="w-5 h-5 text-green-500" />,
  cancelled: <PackageX className="w-5 h-5 text-red-500" />,
};

const statusLabels = {
  created: 'Создан',
  seller_confirmed: 'Подтвержден продавцом',
  admin_confirmed: 'Подтвержден администратором',
  processed: 'Зарегистрирован',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
};

const orderTypeLabels = {
  free_order: 'Свободный заказ',
  ads_order: 'Заказ по объявлению',
};

const BuyerOrders = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isSeller = profile?.user_type === 'seller';

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      console.log("Fetching orders with user ID:", user.id);
      const query = supabase
        .from('orders')
        .select(`
          *,
          product_id,
          products (
            lot_number
          ),
          seller:profiles!orders_seller_id_fkey (
            phone,
            telegram,
            opt_id
          )
        `);

      if (isSeller) {
        query.or(`seller_id.eq.${user.id},order_created_type.eq.ads_order`);
      } else {
        query.eq('buyer_id', user.id);
      }
      const { data: ordersData, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }

      const ordersWithConfirmations = await Promise.all(ordersData.map(async (order) => {
        const { data: confirmImages, error: confirmError } = await supabase
          .from('confirm_images')
          .select('url')
          .eq('order_id', order.id);

        if (confirmError) console.error("Error fetching confirm images:", confirmError);
        
        return {
          ...order,
          hasConfirmImages: confirmImages && confirmImages.length > 0
        };
      }));

      console.log("Fetched orders:", ordersWithConfirmations);
      return ordersWithConfirmations || [];
    },
    enabled: !!user,
    staleTime: 15000,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <svg className="h-8 w-8 animate-spin text-optapp-yellow" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-4"
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">
            {isSeller ? 'Заказы по моим объявлениям' : 'Мои заказы'}
          </h1>
        </div>

        {orders && orders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className={`bg-white rounded-xl shadow-md border hover:shadow-xl transition-all flex flex-col
                  ${order.status === 'delivered' ? 'border-green-200' :
                    order.status === 'cancelled' ? 'border-red-200' :
                    order.status === 'seller_confirmed' ? 'border-blue-200' :
                    order.status === 'admin_confirmed' ? 'border-purple-200' :
                    order.status === 'shipped' ? 'border-orange-200' :
                    order.status === 'processed' ? 'border-yellow-200' :
                    'border-gray-100'
                  }
                `}
              >
                <div className="flex items-center justify-between gap-2 px-4 pt-4">
                  {statusIcons[order.status] || statusIcons['created']}
                  <Badge className={`text-base px-3 py-1 ${statusColors[order.status] || statusColors["created"]}`}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                  {order.hasConfirmImages && (
                    <OrderConfirmImagesDialog orderId={order.id} />
                  )}
                </div>
                <div className="flex-1 flex flex-col px-4 py-2">
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-lg">Заказ № {order.order_number}</span>
                    <span className="text-sm text-muted-foreground">Лот: {order.products?.lot_number || "Н/Д"}</span>
                  </div>
                  <div className="mt-2">
                    <div className="font-medium text-base truncate">{order.title}</div>
                    <div className="text-sm text-muted-foreground">{order.brand} {order.model}</div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="font-medium text-optapp-dark">{order.price} $</span>
                    <span className="text-xs text-gray-500">{order.place_number ? `Мест: ${order.place_number}` : null}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{orderTypeLabels[order.order_created_type]}</Badge>
                    <Badge variant="outline">
                      {order.buyer_opt_id || 'Не указан'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">
                    Продавец: <span className="font-medium">{order.order_seller_name}</span>
                  </div>
                  
                  {order.text_order && order.text_order.trim() !== "" && (
                    <div className="text-sm text-gray-600 mt-2 border-t pt-2">
                      <span className="font-medium">Доп. информация:</span>
                      <p className="mt-1 whitespace-pre-wrap">{order.text_order}</p>
                    </div>
                  )}
                </div>
                {order.status === 'admin_confirmed' && isSeller && (
                  <div className="mt-2 space-y-2">
                    <OrderConfirmButton orderId={order.id} />
                  </div>
                )}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 rounded-b-xl">
                  <Link
                    to={`/product/${order.product_id}`}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                  >
                    Подробнее
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {order.created_at && new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">У вас пока нет заказов</p>
            <Button
              className="mt-4 bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
              onClick={() => navigate('/catalog')}
            >
              Перейти в каталог
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerOrders;
