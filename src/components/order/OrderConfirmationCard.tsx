import React, { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  XCircle, 
  Package, 
  Calendar, 
  User, 
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrderConfirmationCardProps {
  order: any;
  buyerProfile: any;
  onClose: () => void;
}

const OrderConfirmationCard: React.FC<OrderConfirmationCardProps> = ({ order, buyerProfile, onClose }) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'processing': return 'primary';
      case 'shipped': return 'info';
      case 'delivered': return 'success';
      case 'cancelled': return 'destructive';
      case 'refunded': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!order) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>
              Не удалось загрузить информацию о заказе.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        {order.status === 'cancelled' || order.status === 'refunded' ? (
          <div className="text-red-600 flex items-center space-x-2">
            <XCircle className="h-5 w-5" />
            <span>Заказ отменен</span>
          </div>
        ) : (
          <div className="text-green-600 flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Заказ успешно создан!</span>
          </div>
        )}

        <div className="flex justify-between">
          <div>
            <div className="text-sm text-muted-foreground">Номер заказа</div>
            <div className="font-medium">{order.id}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Статус</div>
            <Badge variant={getStatusBadgeVariant(order.status)}>{order.status}</Badge>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Товары</div>
            <div className="font-medium">{order.products?.length} шт.</div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Дата создания</div>
            <div className="font-medium">
              {format(new Date(order.created_at), 'dd MMMM yyyy, HH:mm', { locale: ru })}
            </div>
          </div>
        </div>

        {buyerProfile && (
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-sm text-muted-foreground">Покупатель</div>
              <div className="font-medium">{buyerProfile.full_name}</div>
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm text-muted-foreground">Общая стоимость</div>
            <div className="font-medium">{order.total_price} AED</div>
          </div>
        </div>

        {isExpanded && (
          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">Дополнительная информация</div>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Адрес доставки</div>
                <div className="font-medium">{order.delivery_address || 'Не указан'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Примечания</div>
                <div className="font-medium">{order.notes || 'Нет'}</div>
              </div>
            </div>
          </div>
        )}

        <Button variant="link" onClick={toggleExpanded}>
          {isExpanded ? 'Скрыть детали' : 'Показать детали'}
        </Button>

        <div className="border-t pt-4">
          <Button className="w-full" onClick={onClose}>
            Закрыть
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderConfirmationCard;
