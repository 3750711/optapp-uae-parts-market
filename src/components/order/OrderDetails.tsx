
import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "lucide-react";
import { useAuth } from '@/contexts/SimpleAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type Order = Database['public']['Tables']['orders']['Row'] & {
  buyer?: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  seller?: {
    telegram: string | null;
    full_name: string | null;
    opt_id: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

interface OrderDetailsProps {
  order: Order;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isSelfOrder = order.seller_id === order.buyer_id;
  const isBuyer = user?.id === order.buyer_id;
  const isSeller = user?.id === order.seller_id;
  
  // Changed this line to properly check authorization
  // We consider a user authorized if they are logged in, regardless of their role in this order
  const isAuthorized = !!user;

  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'self_pickup':
        return 'Самовывоз';
      case 'cargo_rf':
        return 'Доставка Cargo РФ';
      case 'cargo_kz':
        return 'Доставка Cargo KZ';
      default:
        return method;
    }
  };

  const getContainerStatusLabel = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'Ожидание';
      case 'in_transit':
        return 'В пути';
      case 'delivered':
        return 'Доставлен';
      case 'customs':
        return 'На таможне';
      default:
        return status;
    }
  };

  const getContainerStatusColor = (status: string) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'customs':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeliveryMethodChange = async (newMethod: Database['public']['Enums']['delivery_method']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_method: newMethod })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Успешно обновлено",
        description: "Способ доставки успешно изменен",
      });
    } catch (error) {
      console.error('Error updating delivery method:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить способ доставки",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-500">Наименование</Label>
          <p className="text-lg font-medium">{order.title}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Бренд</Label>
          <p className="text-lg font-medium">{order.brand}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Модель</Label>
          <p className="text-lg font-medium">{order.model}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Цена</Label>
          <p className="text-lg font-medium">{order.price} $</p>
        </div>
        {order.delivery_price_confirm && (
          <div>
            <Label className="text-sm text-gray-500">Стоимость доставки</Label>
            <p className="text-lg font-medium text-green-600">{order.delivery_price_confirm} $</p>
          </div>
        )}
        <div>
          <Label className="text-sm text-gray-500">Мест для отправки</Label>
          <p className="text-lg font-medium">{order.place_number || 1}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Тип заказа</Label>
          <p className="text-lg font-medium">
            {order.order_created_type === 'free_order' ? 'Свободный заказ' : 'Заказ по объявлению'}
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-gray-500">OPT ID покупателя</Label>
          {isAuthorized ? (
            <p className="text-lg font-medium">{order.buyer_opt_id || 'Не указан'}</p>
          ) : (
            <p className="text-lg font-medium text-gray-400">Требуется авторизация</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-gray-500">OPT ID отправителя</Label>
          {isAuthorized ? (
            <p className="text-lg font-medium">{order.seller?.opt_id || order.seller_opt_id || 'Не указан'}</p>
          ) : (
            <p className="text-lg font-medium text-gray-400">Требуется авторизация</p>
          )}
        </div>
        <div>
          <Label className="text-sm text-gray-500">Имя отправителя</Label>
          <p className="text-lg font-medium">{order.order_seller_name}</p>
        </div>
        <div>
          <Label className="text-sm text-gray-500">Информация о получателе</Label>
          {isAuthorized && order.telegram_url_order ? (
            <div className="space-y-2">
              <a 
                href={`https://t.me/${order.telegram_url_order.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {order.telegram_url_order}
                <Link className="h-4 w-4" />
              </a>
            </div>
          ) : order.telegram_url_order ? (
            <p className="text-gray-500">Требуется авторизация для просмотра контактов</p>
          ) : (
            <p className="text-gray-500">Контакты не указаны</p>
          )}
        </div>
        {isSelfOrder && (
          <div>
            <Label className="text-sm text-gray-500">Тип</Label>
            <p className="text-lg font-medium text-amber-600">Самозаказ</p>
          </div>
        )}
        <div>
          <Label className="text-sm text-gray-500">Способ доставки</Label>
          {isBuyer ? (
            <Select value={order.delivery_method} onValueChange={handleDeliveryMethodChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите способ доставки" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self_pickup">Самовывоз</SelectItem>
                <SelectItem value="cargo_rf">Доставка Cargo РФ</SelectItem>
                <SelectItem value="cargo_kz">Доставка Cargo KZ</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <p className="text-lg font-medium">
              {getDeliveryMethodLabel(order.delivery_method)}
            </p>
          )}
        </div>
        
        {/* Информация о контейнере */}
        {order.container_number && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-1 rounded text-white text-sm font-bold">
                OPTCargo
              </div>
            </div>
            
            <div>
              <Label className="text-sm text-gray-500">Номер контейнера</Label>
              <p className="text-lg font-medium text-yellow-800">{order.container_number}</p>
            </div>
            
            {order.container_status && (
              <div>
                <Label className="text-sm text-gray-500">Статус контейнера</Label>
                <div className="mt-1">
                  <Badge className={`${getContainerStatusColor(order.container_status)} text-sm px-3 py-1`}>
                    {getContainerStatusLabel(order.container_status)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
