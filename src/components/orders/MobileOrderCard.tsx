
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { OrderConfirmButton } from '@/components/order/OrderConfirmButton';
import { OrderSearchResult } from '@/hooks/useOrdersSearch';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { OrderConfirmationImages } from '@/components/order/OrderConfirmationImages';
import { Camera, CheckCircle } from 'lucide-react';
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

interface MobileOrderCardProps {
  order: OrderSearchResult;
  isSeller: boolean;
}

const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  isSeller
}) => {
  const [isConfirmImagesDialogOpen, setIsConfirmImagesDialogOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border hover:shadow-lg transition-all p-3 relative overflow-hidden">
        {/* Заголовок с номером заказа и статусом */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-gray-900">№{order.order_number}</span>
            <Badge className={`text-xs px-2 py-1 ${statusColors[order.status] || statusColors["created"]}`}>
              {statusLabels[order.status] || order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {order.hasConfirmImages ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-green-600 hover:text-green-700"
                onClick={() => setIsConfirmImagesDialogOpen(true)}
              >
                <CheckCircle className="h-5 w-5" />
              </Button>
            ) : (
              isSeller && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setIsConfirmImagesDialogOpen(true)}
                >
                  <Camera className="h-5 w-5" />
                </Button>
              )
            )}
            <span className="text-xs text-gray-500">
              {order.created_at && new Date(order.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>

        {/* Информация о товаре */}
        <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 mb-3">
          <OrderImageThumbnail orderId={order.id} className="h-12 w-12" size="thumbnail" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base mb-1 line-clamp-2 text-gray-900">
              {order.title}
            </div>
            <div className="text-sm text-gray-600 mb-2">
              {order.brand} {order.model}
            </div>
            <div className="text-sm text-gray-500">
              Лот: {order.products?.lot_number || "Н/Д"}
            </div>
          </div>
        </div>

        {/* Цены в компактном виде */}
        <div className="bg-gradient-to-r from-blue-50 to-transparent rounded-lg p-3 mb-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500 mb-1">Цена товара</div>
              <div className="font-bold text-lg text-blue-600">{order.price} $</div>
            </div>
            {order.delivery_price_confirm && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Доставка</div>
                <div className="font-semibold text-sm text-green-600">{order.delivery_price_confirm} $</div>
              </div>
            )}
            <div>
              <div className="text-xs text-gray-500 mb-1">Мест</div>
              <div className="font-semibold text-sm text-gray-700">{order.place_number || 0}</div>
            </div>
          </div>
        </div>

        {/* Информация о продавце */}
        <div className="bg-yellow-50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 mb-1">Продавец</div>
              <div className="font-medium text-sm text-gray-900 truncate">
                {order.order_seller_name}
              </div>
            </div>
            {(order.seller?.opt_id || order.seller_opt_id) && (
              <div className="ml-2 shrink-0">
                <div className="text-xs bg-yellow-200 px-2 py-1 rounded font-mono">
                  {order.seller?.opt_id || order.seller_opt_id}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Тип заказа и доставка */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            {orderTypeLabels[order.order_created_type] || order.order_created_type}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            {order.buyer_opt_id || 'ID не указан'}
          </Badge>

          {/* Показываем доставку или контейнер */}
          {order.container_number ? (
            <>
              <Badge variant="outline" className="bg-yellow-50 border-yellow-400 text-yellow-700 text-xs">
                Контейнер: {order.container_number}
              </Badge>
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-2 py-1 rounded text-white text-xs font-bold shadow-sm">
                OPTCargo
              </div>
            </>
          ) : (
            order.delivery_method && (
              <Badge variant="outline" className="text-xs text-gray-600">
                {deliveryMethodLabels[order.delivery_method] || order.delivery_method}
              </Badge>
            )
          )}
        </div>

        {/* Дополнительная информация */}
        {order.text_order && order.text_order.trim() !== "" && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-500 mb-1 font-medium">Дополнительная информация:</div>
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">{order.text_order}</p>
          </div>
        )}

        {/* Кнопка подтверждения для продавца */}
        {order.status === 'admin_confirmed' && isSeller && (
          <div className="mb-3">
            <OrderConfirmButton orderId={order.id} />
          </div>
        )}

        {/* Нижняя панель с кнопкой */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {order.id ? (
            <Link 
              to={`/order/${order.id}`} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg font-medium text-sm transition-colors"
            >
              Подробнее
            </Link>
          ) : (
            <span className="text-sm text-gray-400 text-center flex-1">Недоступно</span>
          )}
        </div>
      </div>
      <Dialog open={isConfirmImagesDialogOpen} onOpenChange={setIsConfirmImagesDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] rounded-lg">
          <DialogHeader>
            <DialogTitle>Подтверждающие фотографии - Заказ № {order.order_number}</DialogTitle>
          </DialogHeader>
          <OrderConfirmationImages 
            orderId={order.id} 
            canEdit={isSeller}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MobileOrderCard;
