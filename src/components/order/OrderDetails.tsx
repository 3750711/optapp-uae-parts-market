import React from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Package, Calendar, User, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import OrderVideos from './OrderVideos';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  created_at: string;
  status: string;
  delivery_address: string;
  delivery_price: number;
  total_price: number;
  notes: string;
  seller_id: string;
  buyer_id: string;
}

const OrderDetails: React.FC = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Order;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Загрузка заказа...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[150px] mt-2" />
          <div className="mt-4">
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[250px] mt-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ошибка загрузки заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Не удалось загрузить детали заказа. Пожалуйста, попробуйте позже.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Заказ не найден</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Заказ с указанным ID не найден.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'info';
      case 'shipped': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Детали заказа #{order.id}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4" />
          <span>Статус:</span>
          <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4" />
          <span>Дата создания:</span>
          <span>{format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}</span>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>ID продавца:</span>
          <span>{order.seller_id}</span>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4" />
          <span>ID покупателя:</span>
          <span>{order.buyer_id}</span>
        </div>
        <div>
          <span>Адрес доставки:</span>
          <p>{order.delivery_address}</p>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>Стоимость доставки:</span>
          <span>{order.delivery_price}</span>
        </div>
        <div className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>Общая стоимость:</span>
          <span>{order.total_price}</span>
        </div>
        <div>
          <span>Примечания:</span>
          <p>{order.notes}</p>
        </div>
        <OrderVideos orderId={order.id} />
        <Button onClick={() => navigate(-1)}>
          Назад
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrderDetails;
