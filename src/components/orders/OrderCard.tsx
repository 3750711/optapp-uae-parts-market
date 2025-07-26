
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileOrderCard from './MobileOrderCard';
import { OrderSearchResult } from '@/hooks/useOrdersSearch';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { OrderConfirmImagesDialog } from '@/components/order/OrderConfirmImagesDialog';
import { OrderConfirmButton } from '@/components/order/OrderConfirmButton';
import { OrderImageThumbnail } from '@/components/order/OrderImageThumbnail';

const statusColors = {
  created: 'bg-gray-100 text-gray-800',
  seller_confirmed: 'bg-blue-100 text-blue-800',
  admin_confirmed: 'bg-purple-100 text-purple-800',
  processed: 'bg-yellow-100 text-yellow-800',
  shipped: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  created: 'Создан',
  seller_confirmed: 'Подтвержден продавцом',
  admin_confirmed: 'Подтвержден администратором',
  processed: 'Зарегистрирован',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен'
};

const orderTypeLabels = {
  free_order: 'Свободный заказ',
  ads_order: 'Заказ по объявлению'
};

const deliveryMethodLabels = {
  self_pickup: 'Самовывоз',
  cargo_russia: 'Cargo РФ',
  cargo_kazakhstan: 'Cargo КЗ'
};

interface OrderCardProps {
  order: OrderSearchResult;
  isSeller: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, isSeller }) => {
  const isMobile = useIsMobile();

  // Используем мобильную версию на маленьких экранах
  if (isMobile) {
    return <MobileOrderCard order={order} isSeller={isSeller} />;
  }

  // Десктопная версия
  return (
    <div className={`bg-white rounded-xl shadow-md border hover:shadow-xl transition-all p-4 relative
        ${order.status === 'delivered' ? 'border-green-200' : order.status === 'cancelled' ? 'border-red-200' : order.status === 'seller_confirmed' ? 'border-blue-200' : order.status === 'admin_confirmed' ? 'border-purple-200' : order.status === 'shipped' ? 'border-orange-200' : order.status === 'processed' ? 'border-yellow-200' : 'border-gray-100'}
      `}>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-lg">Заказ № {order.order_number}</span>
              <Badge className={`text-sm px-2 py-1 ${statusColors[order.status] || statusColors["created"]}`}>
                {statusLabels[order.status] || order.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">Лот: {order.products?.lot_number || "Н/Д"}</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {order.hasConfirmImages && <OrderConfirmImagesDialog orderId={order.id} />}
          <span className="text-xs text-muted-foreground">
            {order.created_at && new Date(order.created_at).toLocaleDateString('ru-RU')}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-start gap-3 mb-2">
          <OrderImageThumbnail 
            orderId={order.id} 
            size="card" 
            className="w-16 h-16 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="font-medium text-base mb-1">{order.title}</div>
            <div className="text-sm text-muted-foreground">{order.brand} {order.model}</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-lg text-optapp-dark">{order.price} $</span>
          <span className="text-xs text-gray-500">{order.place_number ? `Мест: ${order.place_number}` : null}</span>
        </div>
        
        {order.delivery_price_confirm && (
          <div className="flex justify-between items-center text-sm mb-2">
            <span className="text-gray-600">Стоимость доставки:</span>
            <span className="font-medium text-optapp-dark">{order.delivery_price_confirm} $</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{orderTypeLabels[order.order_created_type] || order.order_created_type}</Badge>
          <Badge variant="outline">
            {order.buyer_opt_id || 'Не указан'}
          </Badge>
          
          {/* Показываем доставку или контейнер */}
          {order.container_number ? (
            <Badge variant="outline" className="bg-yellow-50 border-yellow-400 text-yellow-700">
              Контейнер: {order.container_number}
            </Badge>
          ) : (
            order.delivery_method && (
              <Badge variant="outline" className="text-gray-600">
                {deliveryMethodLabels[order.delivery_method] || order.delivery_method}
              </Badge>
            )
          )}
        </div>

        <div className="text-sm text-gray-500 mb-2">
          <div className="flex items-center justify-between">
            <span>Продавец: <span className="font-medium">{order.order_seller_name}</span></span>
            {(order.seller?.opt_id || order.seller_opt_id) && (
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                OPT ID: {order.seller?.opt_id || order.seller_opt_id}
              </span>
            )}
          </div>
        </div>
        
        {order.text_order && order.text_order.trim() !== "" && (
          <div className="text-sm text-gray-600 mb-3 border-t pt-2">
            <span className="font-medium">Доп. информация:</span>
            <p className="mt-1 whitespace-pre-wrap">{order.text_order}</p>
          </div>
        )}
      </div>

      {order.status === 'admin_confirmed' && isSeller && (
        <div className="mb-3">
          <OrderConfirmButton orderId={order.id} />
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t bg-gray-50 -mx-4 px-4 py-3 rounded-b-xl">
        <div className="flex items-center gap-3">
          {order.id ? (
            <Link 
              to={`/order/${order.id}`} 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
            >
              Подробнее
            </Link>
          ) : (
            <span className="text-sm text-gray-400">Недоступно</span>
          )}
          
          {/* Логотип OPTCargo в нижней части только если есть номер контейнера */}
          {order.container_number && (
            <div className="bg-gradient-to-r from-yellow-400 via-yellow-400 to-yellow-400 px-3 py-1 rounded-lg shadow-lg border border-yellow-300 bg-[#f3c83c]">
              <span className="text-white font-bold text-xs tracking-wider drop-shadow-sm">
                OPTCargo
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
