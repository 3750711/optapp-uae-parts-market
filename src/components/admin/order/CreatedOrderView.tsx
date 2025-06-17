
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, ExternalLink, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';

interface CreatedOrderViewProps {
  order: any;
  images: string[];
  videos?: string[];
  onBack: () => void;
  onNewOrder: () => void;
  onOrderUpdate: (order: any) => void;
}

export const CreatedOrderView: React.FC<CreatedOrderViewProps> = ({
  order,
  images,
  videos = [],
  onBack,
  onNewOrder,
  onOrderUpdate
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.order_number.toString());
      setCopied(true);
      toast({
        title: "Скопировано",
        description: "Номер заказа скопирован в буфер обмена",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать номер заказа",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Создан';
      case 'pending': return 'В ожидании';
      case 'confirmed': return 'Подтвержден';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменен';
      default: return status;
    }
  };

  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'self_pickup': return 'Самовывоз';
      case 'cargo_rf': return 'Карго РФ';
      case 'cargo_kz': return 'Карго КЗ';
      default: return method;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-green-600">
              Заказ успешно создан!
            </h1>
            <p className="text-gray-600">
              Заказ #{order.order_number} был создан и сохранен в системе
            </p>
          </div>
        </div>
        <Button onClick={onNewOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Создать новый заказ
        </Button>
      </div>

      {/* Order Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-3">
              <span>Информация о заказе</span>
              <Badge className={getStatusColor(order.status)}>
                {getStatusText(order.status)}
              </Badge>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">№ {order.order_number}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOrderNumber}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Название</label>
                <p className="text-lg font-semibold">{order.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Цена</label>
                <p className="text-lg font-semibold text-green-600">
                  ${order.price}
                </p>
              </div>
              {order.delivery_price_confirm && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Стоимость доставки</label>
                  <p className="text-lg font-semibold">
                    ${order.delivery_price_confirm}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Способ доставки</label>
                <p className="text-lg">{getDeliveryMethodText(order.delivery_method)}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {order.brand && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Бренд</label>
                  <p className="text-lg">{order.brand}</p>
                </div>
              )}
              {order.model && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Модель</label>
                  <p className="text-lg">{order.model}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Количество мест</label>
                <p className="text-lg">{order.place_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Дата создания</label>
                <p className="text-lg">
                  {new Date(order.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {order.text_order && (
            <>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Дополнительная информация</label>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{order.text_order}</p>
              </div>
            </>
          )}

          {/* Participants */}
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Продавец</h3>
              <div className="space-y-2">
                <p><span className="text-gray-500">Имя:</span> {order.order_seller_name}</p>
                {order.seller_opt_id && (
                  <p><span className="text-gray-500">OPT ID:</span> {order.seller_opt_id}</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Покупатель</h3>
              <div className="space-y-2">
                {order.buyer_opt_id && (
                  <p><span className="text-gray-500">OPT ID:</span> {order.buyer_opt_id}</p>
                )}
                {order.telegram_url_buyer && (
                  <p><span className="text-gray-500">Telegram:</span> {order.telegram_url_buyer}</p>
                )}
              </div>
            </div>
          </div>

          {/* Media */}
          {(images.length > 0 || videos.length > 0) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Медиафайлы</h3>
                
                {images.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Изображения ({images.length})</h4>
                    <OptimizedOrderImages 
                      images={images} 
                      orderTitle={order.title}
                    />
                  </div>
                )}
                
                {videos.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium mb-2">Видео ({videos.length})</h4>
                    <OptimizedOrderVideos videos={videos} />
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Вернуться к списку
        </Button>
        <Button onClick={onNewOrder}>
          <Plus className="h-4 w-4 mr-2" />
          Создать новый заказ
        </Button>
      </div>
    </div>
  );
};
