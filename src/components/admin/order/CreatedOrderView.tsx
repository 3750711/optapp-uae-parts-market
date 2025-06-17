
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OptimizedOrderImages } from "@/components/order/OptimizedOrderImages";
import { OptimizedOrderVideos } from "@/components/order/OptimizedOrderVideos";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { CheckCircle, Package, User, MapPin, Phone, MessageCircle, Calendar, Hash, DollarSign } from "lucide-react";

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'cargo_rf': return 'Доставка Cargo РФ';
      case 'cargo_kz': return 'Доставка Cargo KZ';
      case 'self_pickup': return 'Самовывоз';
      default: return method;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">Заказ успешно создан!</CardTitle>
          <CardDescription className="text-green-700">
            Заказ #{order.order_number} был создан и готов к обработке
          </CardDescription>
          <div className="flex justify-center gap-4 mt-6">
            <Button variant="outline" onClick={onBack}>
              Вернуться в панель
            </Button>
            <Button onClick={onNewOrder}>
              Создать новый заказ
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-blue-600" />
                  <CardTitle>Информация о заказе</CardTitle>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Номер заказа:</span>
                  <span>#{order.order_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Создан:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Цена:</span>
                  <span className="font-semibold text-green-600">{order.price} AED</span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Количество мест:</span>
                  <span>{order.place_number}</span>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-medium text-lg mb-2">{order.title}</h3>
                {(order.brand || order.model) && (
                  <div className="flex gap-2 mb-3">
                    {order.brand && <Badge variant="secondary">{order.brand}</Badge>}
                    {order.model && <Badge variant="outline">{order.model}</Badge>}
                  </div>
                )}
                {order.text_order && (
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{order.text_order}</p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Доставка
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Способ доставки:</span>
                    <Badge variant="outline">{getDeliveryMethodText(order.delivery_method)}</Badge>
                  </div>
                  {order.delivery_price_confirm > 0 && (
                    <div className="flex justify-between">
                      <span>Стоимость доставки:</span>
                      <span className="font-medium">{order.delivery_price_confirm} AED</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Section */}
          {(images.length > 0 || videos.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Медиафайлы заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {images.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Изображения ({images.length})</h3>
                    <OptimizedOrderImages images={images} orderTitle={order.title} />
                  </div>
                )}
                
                {videos.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Видео ({videos.length})</h3>
                    <OptimizedOrderVideos videos={videos} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Participants Sidebar */}
        <div className="space-y-6">
          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Продавец
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.order_seller_name || 'Не указано'}</p>
                {order.seller_opt_id && (
                  <p className="text-sm text-gray-600">OPT ID: {order.seller_opt_id}</p>
                )}
              </div>
              {order.telegram_url_order && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600">@{order.telegram_url_order}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Buyer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-green-600" />
                Покупатель
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.buyer_opt_id && (
                <div>
                  <p className="font-medium">OPT ID: {order.buyer_opt_id}</p>
                </div>
              )}
              {order.telegram_url_buyer && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageCircle className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-600">@{order.telegram_url_buyer}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Type */}
          <Card>
            <CardHeader>
              <CardTitle>Тип заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="w-full justify-center py-2">
                {order.order_created_type === 'free_order' ? 'Свободный заказ' : 'Заказ из товара'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
