import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Package, User, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const BuyerOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['buyer-orders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          seller:profiles!orders_seller_id_fkey(full_name, opt_id),
          buyer:profiles!orders_buyer_id_fkey(full_name, opt_id)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'В ожидании', variant: 'secondary' as const },
      processing: { label: 'В обработке', variant: 'default' as const },
      shipped: { label: 'Отправлен', variant: 'default' as const },
      delivered: { label: 'Доставлен', variant: 'success' as const },
      cancelled: { label: 'Отменен', variant: 'destructive' as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Мои заказы</h1>
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Произошла ошибка при загрузке заказов</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Мои заказы</h1>
          <Button asChild>
            <Link to="/buyer-create-order">Создать заказ</Link>
          </Button>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">У вас пока нет заказов</h3>
              <p className="text-muted-foreground mb-4">
                Создайте свой первый заказ, чтобы начать покупки
              </p>
              <Button asChild>
                <Link to="/buyer-create-order">Создать первый заказ</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Заказ #{order.id.slice(0, 8)}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <CalendarClock className="h-4 w-4" />
                        {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Продавец</p>
                        <p className="text-sm text-muted-foreground">
                          {order.seller?.full_name || 'Неизвестно'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Сумма</p>
                        <p className="text-sm text-muted-foreground">
                          {order.total_price ? `${order.total_price} AED` : 'Не указана'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Доставка</p>
                        <p className="text-sm text-muted-foreground">
                          {order.delivery_address || 'Не указан адрес'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mt-4 p-3 bg-muted rounded-md">
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end mt-4">
                    <Button variant="outline" asChild>
                      <Link to={`/order-details/${order.id}`}>
                        Подробнее
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default BuyerOrders;
