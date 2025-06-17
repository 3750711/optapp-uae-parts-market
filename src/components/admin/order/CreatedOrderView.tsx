
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Package, DollarSign, User, Calendar, Plus, Camera } from 'lucide-react';
import OptimizedOrderImages from '@/components/order/OptimizedOrderImages';
import { OptimizedOrderVideos } from '@/components/order/OptimizedOrderVideos';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileFormSection } from './MobileFormSection';

interface CreatedOrderViewProps {
  order: any;
  images: string[];
  videos?: string[];
  onNewOrder: () => void;
  onOrderUpdate?: (order: any) => void;
}

export const CreatedOrderView: React.FC<CreatedOrderViewProps> = ({
  order,
  images,
  videos = [],
  onNewOrder
}) => {
  const isMobile = useIsMobile();

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
    <div className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className={`flex items-center ${isMobile ? 'flex-col text-center space-y-4' : 'justify-center space-x-4'}`}>
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div className={isMobile ? 'text-center' : ''}>
              <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-800 mb-2`}>
                Заказ успешно создан!
              </h1>
              <p className="text-green-700">
                Заказ #{order.order_number} готов к обработке
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details - всегда открыто */}
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 lg:grid-cols-2 gap-6'}`}>
        {/* Basic Information */}
        <MobileFormSection 
          title="Информация о заказе" 
          icon={<Package className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Номер заказа</div>
              <div className={`font-mono ${isMobile ? 'text-lg' : 'text-lg'} font-bold`}>{order.order_number}</div>
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
          </div>
        </MobileFormSection>

        {/* Financial Information */}
        <MobileFormSection 
          title="Финансовая информация" 
          icon={<DollarSign className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Цена товара</div>
              <div className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-green-600`}>${order.price}</div>
            </div>
            {order.delivery_price_confirm && (
              <div>
                <div className="text-sm text-muted-foreground">Стоимость доставки</div>
                <div className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold`}>${order.delivery_price_confirm}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-muted-foreground">Количество мест</div>
              <div className="font-medium">{order.place_number || 1}</div>
            </div>
          </div>
        </MobileFormSection>

        {/* Participants */}
        <MobileFormSection 
          title="Участники заказа" 
          icon={<User className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Продавец</div>
              <div className="font-medium">{order.order_seller_name || 'Не указан'}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Покупатель</div>
              <div className="font-medium">ID: {order.buyer_id}</div>
            </div>
          </div>
        </MobileFormSection>

        {/* Timeline */}
        <MobileFormSection 
          title="Временная линия" 
          icon={<Calendar className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="space-y-4">
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
          </div>
        </MobileFormSection>
      </div>

      {/* Media Section - всегда открыто */}
      {(images.length > 0 || videos.length > 0) && (
        <MobileFormSection 
          title={`Медиафайлы заказа (${images.length + videos.length})`}
          icon={<Camera className="h-5 w-5" />}
          defaultOpen={true}
        >
          <div className="space-y-6">
            {images.length > 0 && (
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4`}>Изображения ({images.length})</h3>
                <OptimizedOrderImages images={images} />
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-medium mb-4`}>Видео ({videos.length})</h3>
                <OptimizedOrderVideos videos={videos} />
              </div>
            )}
          </div>
        </MobileFormSection>
      )}

      {/* Additional Information */}
      {order.text_order && (
        <MobileFormSection 
          title="Дополнительная информация"
          defaultOpen={true}
        >
          <div className="bg-muted/30 p-4 rounded-lg">
            <p className="whitespace-pre-wrap">{order.text_order}</p>
          </div>
        </MobileFormSection>
      )}

      {/* Actions - фиксированные внизу для мобильного */}
      {isMobile ? (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
          <Button
            onClick={onNewOrder}
            size="lg"
            className="w-full touch-target min-h-[48px] text-base font-medium"
          >
            <Plus className="mr-2 h-4 w-4" />
            Создать новый заказ
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  );
};
