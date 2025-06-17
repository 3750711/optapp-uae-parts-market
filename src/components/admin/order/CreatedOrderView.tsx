
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, DollarSign, User, Calendar, Plus } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';

interface CreatedOrderViewProps {
  order: any;
  images: string[];
  videos?: string[];
  onBack?: () => void;
  onNewOrder: () => void;
  onOrderUpdate?: (order: any) => void;
}

export const CreatedOrderView: React.FC<CreatedOrderViewProps> = ({
  order,
  images,
  videos = [],
  onNewOrder
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Заказ успешно создан!
              </h1>
              <p className="text-green-700">
                Заказ #{order.order_number} готов к обработке
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Информация о заказе
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Номер заказа</div>
              <div className="font-mono text-lg font-bold">{order.order_number}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Наименование</div>
              <div className="font-medium">{order.title}</div>
            </div>
            {order.brand && (
              <div>
                <div className="text-sm text-muted-foreground">Бренд</div>
                <div className="font-medium">{order.brand}</div>
              </div>
            )}
            {order.model && (
              <div>
                <div className="text-sm text-muted-foreground">Модель</div>
                <div className="font-medium">{order.model}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Статус</div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {order.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Финансовая информация
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Цена товара</div>
              <div className="text-2xl font-bold text-green-600">${order.price}</div>
            </div>
            {order.delivery_price_confirm && (
              <div>
                <div className="text-sm text-muted-foreground">Стоимость доставки</div>
                <div className="text-lg font-semibold">${order.delivery_price_confirm}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Количество мест</div>
              <div className="font-medium">{order.place_number || 1}</div>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Участники заказа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Продавец</div>
              <div className="font-medium">{order.order_seller_name || 'Не указан'}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Покупатель</div>
              <div className="font-medium">ID: {order.buyer_id}</div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Временная линия
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Дата создания</div>
              <div className="font-medium">{formatDate(order.created_at)}</div>
            </div>
            {order.updated_at && order.updated_at !== order.created_at && (
              <div>
                <div className="text-sm text-muted-foreground">Последнее обновление</div>
                <div className="font-medium">{formatDate(order.updated_at)}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Media Section */}
      {(images.length > 0 || videos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Медиафайлы заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Изображения ({images.length})</h3>
                <OptimizedOrderImages images={images} />
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4">Видео ({videos.length})</h3>
                <OptimizedOrderVideos videos={videos} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      {order.text_order && (
        <Card>
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{order.text_order}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-center pt-6 border-t">
        <Button
          onClick={onNewOrder}
          size="lg"
          className="min-w-[200px]"
        >
          <Plus className="mr-2 h-4 w-4" />
          Создать новый заказ
        </Button>
      </div>
    </div>
  );
};
