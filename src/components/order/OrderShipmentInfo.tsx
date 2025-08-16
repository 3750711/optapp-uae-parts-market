import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Container, Truck, Clock } from 'lucide-react';
import { useOrderShipments } from '@/hooks/useOrderShipments';

interface OrderShipmentInfoProps {
  orderId: string;
}

const getContainerStatusLabel = (status: string) => {
  switch (status) {
    case 'waiting': return 'Ожидание';
    case 'sent_from_uae': return 'Отправлен из ОАЭ';
    case 'transit_iran': return 'Транзит Иран';
    case 'to_kazakhstan': return 'Следует в Казахстан';
    case 'customs': return 'Таможня';
    case 'cleared_customs': return 'Вышел с таможни';
    case 'received': return 'Получен';
    default: return status;
  }
};

const getContainerStatusColor = (status: string) => {
  switch (status) {
    case 'waiting': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'sent_from_uae': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'transit_iran': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'to_kazakhstan': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'customs': return 'bg-red-50 text-red-700 border-red-200';
    case 'cleared_customs': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'received': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

const getShipmentStatusLabel = (status: string) => {
  switch (status) {
    case 'not_shipped': return 'Не отправлен';
    case 'shipped': return 'Отправлен';
    default: return status;
  }
};

const getShipmentStatusColor = (status: string) => {
  switch (status) {
    case 'not_shipped': return 'bg-red-50 text-red-700 border-red-200';
    case 'shipped': return 'bg-green-50 text-green-700 border-green-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

export const OrderShipmentInfo: React.FC<OrderShipmentInfoProps> = ({ orderId }) => {
  const { shipments, isLoading } = useOrderShipments(orderId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Загрузка информации о доставке...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shipments.length) {
    return null;
  }

  const groupedByContainer = shipments.reduce((acc, shipment) => {
    const containerKey = shipment.container_number || 'Не указан';
    if (!acc[containerKey]) {
      acc[containerKey] = [];
    }
    acc[containerKey].push(shipment);
    return acc;
  }, {} as Record<string, typeof shipments>);

  const shippedCount = shipments.filter(s => s.shipment_status === 'shipped').length;
  const totalCount = shipments.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Информация о доставке
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Общий прогресс */}
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Прогресс отправки</span>
            <span className="text-sm text-muted-foreground">
              {shippedCount} из {totalCount} мест
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(shippedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Группировка по контейнерам */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Container className="h-4 w-4" />
            Распределение по контейнерам
          </h4>
          
          {Object.entries(groupedByContainer).map(([containerNumber, containerShipments]) => (
            <Card key={containerNumber} className="border-l-4 border-l-primary/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">
                    Контейнер: {containerNumber}
                  </div>
                  <Badge variant="outline">
                    {containerShipments.length} {containerShipments.length === 1 ? 'место' : 'мест'}
                  </Badge>
                </div>
                
                <div className="grid gap-3">
                  {containerShipments.map((shipment) => (
                    <div key={shipment.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-md">
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">Место {shipment.place_number}</div>
                          {shipment.description && (
                            <div className="text-sm text-muted-foreground">
                              {shipment.description}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1 items-end">
                        <Badge className={getShipmentStatusColor(shipment.shipment_status)}>
                          {getShipmentStatusLabel(shipment.shipment_status)}
                        </Badge>
                        <Badge className={getContainerStatusColor(shipment.container_status)} variant="outline">
                          {getContainerStatusLabel(shipment.container_status)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Статистика */}
        {Object.keys(groupedByContainer).length > 1 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Мультиконтейнерная доставка</span>
            </div>
            <p className="text-sm text-blue-700">
              Ваш заказ разделен на {totalCount} {totalCount === 1 ? 'место' : 'мест'} и отправляется в {Object.keys(groupedByContainer).length} контейнерах. 
              Каждая часть заказа может прибыть в разное время.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};