
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Copy, Check, Calendar, User, Package, DollarSign, Truck, MapPin, Clock, Camera, Star } from 'lucide-react';
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
      case 'created': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'confirmed': return 'bg-green-50 text-green-700 border-green-200';
      case 'processing': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'shipped': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
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

  const isSelfOrder = order.seller_id === order.buyer_id;

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      {/* Header Card */}
      <Card className="mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-green-50 p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-green-700">№ {order.order_number}</h1>
                <Badge className={`${getStatusColor(order.status)} px-3 py-1 text-sm font-medium border`}>
                  {getStatusText(order.status)}
                </Badge>
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
                  ✅ Заказ успешно создан!
                </div>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Создан {new Date(order.created_at).toLocaleDateString('ru-RU', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {isSelfOrder && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Star className="h-3 w-3 mr-1" />
                    Самозаказ
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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
              <Button onClick={onNewOrder}>
                <Plus className="h-4 w-4 mr-2" />
                Создать новый заказ
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Информация о товаре</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Наименование</div>
                    <div className="font-medium text-lg">{order.title}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Бренд</div>
                    <div className="font-medium">{order.brand || 'Не указан'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Модель</div>
                    <div className="font-medium">{order.model || 'Не указана'}</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Цена товара</div>
                    <div className="font-bold text-2xl text-green-600 flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      {order.price}
                    </div>
                  </div>
                  {order.delivery_price_confirm && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Стоимость доставки</div>
                      <div className="font-semibold text-lg text-green-600 flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        ${order.delivery_price_confirm}
                      </div>
                    </div>
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Количество мест</div>
                    <div className="font-medium">{order.place_number}</div>
                  </div>
                </div>
              </div>
              
              {order.text_order && (
                <div className="mt-6 pt-6 border-t">
                  <div className="text-sm text-muted-foreground mb-2">Дополнительная информация</div>
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{order.text_order}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media */}
          {(images.length > 0 || videos.length > 0) && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Медиафайлы</h2>
                  <Badge variant="outline" className="ml-2">
                    {images.length + videos.length} файлов
                  </Badge>
                </div>
                
                {images.length > 0 && (
                  <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Фотографии ({images.length})
                    </div>
                    <OptimizedOrderImages images={images} />
                  </div>
                )}
                
                {videos.length > 0 && (
                  <div>
                    <OptimizedOrderVideos videos={videos} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Participants */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Участники</h2>
              </div>
              
              <div className="space-y-4">
                {/* Seller */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-blue-800">Продавец</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Имя:</span>
                      <span className="ml-2 font-medium">{order.order_seller_name}</span>
                    </div>
                    {order.seller_opt_id && (
                      <div>
                        <span className="text-muted-foreground">OPT ID:</span>
                        <span className="ml-2 font-mono text-xs bg-blue-100 px-2 py-1 rounded">
                          {order.seller_opt_id}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Buyer */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="font-medium text-green-800">Покупатель</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    {order.buyer_opt_id && (
                      <div>
                        <span className="text-muted-foreground">OPT ID:</span>
                        <span className="ml-2 font-mono text-xs bg-green-100 px-2 py-1 rounded">
                          {order.buyer_opt_id}
                        </span>
                      </div>
                    )}
                    {order.telegram_url_buyer && (
                      <div>
                        <span className="text-muted-foreground">Telegram:</span>
                        <span className="ml-2 text-blue-600">{order.telegram_url_buyer}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Доставка</h2>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="font-medium text-yellow-800 mb-2">Способ доставки</div>
                  <div className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-yellow-600" />
                    {getDeliveryMethodText(order.delivery_method)}
                  </div>
                </div>
                
                {/* Container Information */}
                {order.container_number && (
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1 rounded text-white text-sm font-bold">
                        OPTCargo
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Номер контейнера</div>
                        <div className="font-mono text-lg font-semibold text-yellow-800 bg-yellow-100 px-3 py-1 rounded">
                          {order.container_number}
                        </div>
                      </div>
                      
                      {order.container_status && (
                        <div>
                          <div className="text-sm text-muted-foreground mb-1">Статус контейнера</div>
                          <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 border">
                            <Clock className="h-3 w-3 mr-1" />
                            {order.container_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4 mt-8">
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
