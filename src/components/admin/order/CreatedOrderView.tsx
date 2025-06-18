
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, ArrowLeft } from 'lucide-react';
import { CreatedOrderProps } from './types';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';

export const CreatedOrderView: React.FC<CreatedOrderProps> = ({
  order,
  images,
  videos = [],
  onBack,
  onNewOrder,
  onOrderUpdate,
  buyerProfile
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                Заказ успешно создан!
              </h2>
              <p className="text-green-700">
                ID заказа: {order.id}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Детали заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Название</div>
              <div className="font-medium">{order.title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Цена</div>
              <div className="font-bold text-green-600">${formatPrice(order.price)}</div>
            </div>
            {order.brand && (
              <div>
                <div className="text-sm text-gray-600">Бренд</div>
                <div className="font-medium">{order.brand}</div>
              </div>
            )}
            {order.model && (
              <div>
                <div className="text-sm text-gray-600">Модель</div>
                <div className="font-medium">{order.model}</div>
              </div>
            )}
          </div>

          {buyerProfile && (
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Покупатель</div>
              <div className="font-medium">{buyerProfile.full_name} ({buyerProfile.opt_id})</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media */}
      {(images.length > 0 || videos.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Медиафайлы заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {images.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Изображения ({images.length})</h3>
                <OptimizedOrderImages images={images} />
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

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-1">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        )}
        <Button onClick={onNewOrder} className="flex-1">
          <Plus className="mr-2 h-4 w-4" />
          Создать новый заказ
        </Button>
      </div>
    </div>
  );
};
