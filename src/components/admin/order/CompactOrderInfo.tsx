
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Link, Truck, Package, DollarSign } from 'lucide-react';
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';

interface OrderData {
  id: string;
  order_number: number;
  title: string;
  brand?: string;
  model?: string;
  price: number;
  delivery_method: string;
  delivery_price_confirm?: number;
  place_number?: number;
  seller?: {
    telegram?: string;
    full_name?: string;
    opt_id?: string;
  };
  buyer?: {
    telegram?: string;
    full_name?: string;
    opt_id?: string;
  };
}

interface CompactOrderInfoProps {
  order: OrderData;
}

export const CompactOrderInfo: React.FC<CompactOrderInfoProps> = ({ order }) => {
  const getDeliveryMethodConfig = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return { label: 'Самовывоз', icon: Package, color: 'bg-blue-100 text-blue-800' };
      case 'cargo_rf':
        return { label: 'Cargo РФ', icon: Truck, color: 'bg-green-100 text-green-800' };
      case 'cargo_kz':
        return { label: 'Cargo KZ', icon: Truck, color: 'bg-purple-100 text-purple-800' };
      default:
        return { label: 'Не указан', icon: Package, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const deliveryConfig = getDeliveryMethodConfig(order.delivery_method);
  const DeliveryIcon = deliveryConfig.icon;
  const totalPrice = Number(order.price) + Number(order.delivery_price_confirm || 0);

  return (
    <div className="space-y-3">
      {/* Заголовок и основная информация */}
      <div className="flex gap-4 items-start">
        <OrderImageThumbnail orderId={order.id} className="h-16 w-16" />
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg leading-tight line-clamp-2 pr-2">
              {order.title}
            </h3>
            <Badge variant="outline" className="ml-2 font-mono text-xs shrink-0">
              №{order.order_number}
            </Badge>
          </div>
          
          {(order.brand || order.model) && (
            <p className="text-sm text-muted-foreground">
              {order.brand} {order.model}
            </p>
          )}
        </div>
      </div>

      {/* Участники заказа */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Продавец</div>
          <div className="space-y-1">
            <div className="font-medium">{order.seller?.full_name || 'Не указано'}</div>
            {order.seller?.opt_id && (
              <Badge variant="outline" className="text-xs">
                {order.seller.opt_id}
              </Badge>
            )}
            {order.seller?.telegram && (
              <a
                href={`https://t.me/${order.seller.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {order.seller.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="font-medium text-muted-foreground">Покупатель</div>
          <div className="space-y-1">
            <div className="font-medium">{order.buyer?.full_name || 'Не указано'}</div>
            {order.buyer?.opt_id && (
              <Badge variant="outline" className="text-xs">
                {order.buyer.opt_id}
              </Badge>
            )}
            {order.buyer?.telegram && (
              <a
                href={`https://t.me/${order.buyer.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                {order.buyer.telegram}
                <Link className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Финансовая информация */}
      <div className="bg-gray-50 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            Стоимость товара:
          </span>
          <span className="font-semibold">{order.price} $</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">
            <DeliveryIcon className="h-4 w-4" />
            {deliveryConfig.label}:
          </span>
          <span className="font-semibold">
            {order.delivery_price_confirm ? `${order.delivery_price_confirm} $` : 'Не указана'}
          </span>
        </div>
        
        {order.delivery_price_confirm && (
          <div className="flex items-center justify-between text-base font-bold border-t pt-2">
            <span>Итого:</span>
            <span className="text-primary">{totalPrice} $</span>
          </div>
        )}
        
        <div className="flex items-center justify-between text-sm">
          <span>Мест для отправки:</span>
          <Badge variant="secondary">{order.place_number || 1}</Badge>
        </div>
      </div>
    </div>
  );
};
