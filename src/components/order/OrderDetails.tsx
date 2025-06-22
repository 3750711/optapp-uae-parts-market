
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Package, User, FileText, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrderDetailsProps {
  order: any;
  buyer?: any;
  seller?: any;
  products?: any[];
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order, buyer, seller, products }) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'confirmed': return 'secondary';
      case 'created': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Завершен';
      case 'confirmed': return 'Подтвержден';
      case 'created': return 'Создан';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Заказ #{order.id}</CardTitle>
            <Badge variant={getStatusBadgeVariant(order.status)}>
              {getStatusText(order.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{order.delivery_address}</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Доставка: {order.delivery_price} ₽</span>
              </div>

              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Итого: {order.total_price} ₽</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Покупатель: {buyer?.full_name || 'Не указан'}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Продавец: {seller?.full_name || 'Не указан'}</span>
              </div>
            </div>
          </div>

          {products && products.length > 0 && (
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Товары в заказе
              </h4>
              <div className="space-y-2">
                {products.map((product, index) => (
                  <div key={product.id || index} className="p-2 bg-muted rounded text-sm">
                    {product.title || `Товар ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetails;
