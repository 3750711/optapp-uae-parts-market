import React from 'react';
import { Link } from 'react-router-dom';
import { useBuyerOrders } from '@/hooks/useBuyerOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';

export const RecentOrdersSection: React.FC = () => {
  const { data: orders, isLoading } = useBuyerOrders();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Мои заказы
          </h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = orders?.slice(0, 3) || [];

  if (recentOrders.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Мои заказы
          </h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>У вас пока нет заказов</p>
          <Link 
            to="/catalog" 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Сделать первый заказ
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'created':
        return <Badge variant="secondary">Создан</Badge>;
      case 'seller_confirmed':
        return <Badge variant="default">Подтвержден</Badge>;
      case 'admin_confirmed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Обработан</Badge>;
      case 'processed':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">В обработке</Badge>;
      case 'shipped':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Отправлен</Badge>;
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">Доставлен</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Отменен</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Мои заказы
        </h3>
        <Link 
          to="/buyer-orders" 
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Посмотреть все ({orders?.length || 0}) →
        </Link>
      </div>
      <div className="space-y-3">
        {recentOrders.map((order) => (
          <Link key={order.id} to={`/orders/${order.id}`}>
            <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex justify-between items-start">
                <div className="space-y-1 flex-1">
                  <div className="text-sm text-muted-foreground">
                    Заказ #{order.order_number}
                  </div>
                  <div className="font-medium">{order.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatPrice(order.price)} • {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(order.status)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};